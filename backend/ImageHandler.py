import io
import json
import uuid

import matplotlib.pyplot as plt
from rasterio.features import bounds
import rasterio as rio
from matplotlib import pyplot as plt
from pyproj import Transformer
import numpy as np
from matplotlib.colors import ListedColormap
import earthpy.plot as ep
import boto3
from sklearn import cluster


def buildRectangle(lon, lat, delta_lon=0.0275, delta_lat=0.01):
    """
    Calculates the corner coordinates for a polygon centered in a given point, having the width and height specified

    Parameters
    ----------
    lon : float
      Longitude of the center point
    lat : float
      Latitude of the center point
    delta_lon : float
      Rectangle height (in degrees)
    delta_lat : float
      Rectangle width (in degrees)
    """
    c1 = [lon + delta_lon, lat + delta_lat]
    c2 = [lon + delta_lon, lat - delta_lat]
    c3 = [lon - delta_lon, lat - delta_lat]
    c4 = [lon - delta_lon, lat + delta_lat]
    rectangle = {"type": "Polygon", "coordinates": [[c1, c2, c3, c4, c1]]}
    return rectangle


def getDataSubset(geotiff_file, bbox):
    """
    Gets the data range defined by a polygon from a GeoTIFF file stored in a AWS S3 bucket

    Parameters
    ----------
    geotiff_file : str
        The URL of the GeoTIFF file
    bbox : tuple
        The four coordinates defining the polygon
    aws_access_key_id : str
        AWS Access Key ID (The account must have a S3 Read policy associated)
    aws_secret_access_key : str
        AWS Secret Access Key 
    """
    aws_session = rio.session.AWSSession(boto3.Session(), requester_pays=True)
    with rio.Env(aws_session):
        with rio.open(geotiff_file) as geo_fp:
            # Calculate pixels with PyProj
            Transf = Transformer.from_crs("epsg:4326", geo_fp.crs)
            lat_north, lon_west = Transf.transform(bbox[3], bbox[0])
            lat_south, lon_east = Transf.transform(bbox[1], bbox[2])
            x_top, y_top = geo_fp.index(lat_north, lon_west)
            x_bottom, y_bottom = geo_fp.index(lat_south, lon_east)
            # Define window in RasterIO
            window = rio.windows.Window.from_slices(
                (x_top, x_bottom), (y_top, y_bottom))
            # Actual HTTP range request
            subset = geo_fp.read(1, window=window)
    return subset


def getNDVI(nir, red):
    """
    Calculates the Normalized Difference Vegetation Index from the Red and NIR bands

    Parameters
    ----------
    nir : ndarray
        NIR band
    red : ndarray
        Red band
    """
    ndvi = (nir.astype(float)-red.astype(float)) / \
        (nir.astype(float)+red.astype(float))
    return ndvi


def saveMaskImage(clusters, ndvi):
    """
    Renders the forest mask using matplotlib.

    Parameters
    ----------
    clusters : ndarray
      Clusterized green band
    ndvi : ndarray
      Calculated NDVI
    """

    sums = dict()
    counts = dict()
    for i in range(clusters.shape[0]):
        for j in range(clusters.shape[1]):
            elem = clusters[i][j]
            n = ndvi[i][j]
            if elem in sums:
                sums[elem] += n
                counts[elem] += 1
            else:
                sums[elem] = 0.0 + n
                counts[elem] = 1

    max_avg = 0
    max_elem = -1
    for elem in sums:
        if sums[elem]/counts[elem] > max_avg:
            max_avg = sums[elem]/counts[elem]
            max_elem = elem

    # there is no cluster with a NDVI coresponding to a vegetation zone (> 0.45)
    if max_avg < 0.45:
        max_elem = -1

    new_shape = (ndvi.shape[0] * ndvi.shape[1], 1)
    arr = np.array(
        [1 if max_elem == num else 0 for num in clusters.reshape(new_shape)])

    nbr_colors = [(0, 0, 0, 0), "darkgreen"]
    nbr_cmap = ListedColormap(nbr_colors)

    plt.figure(figsize=(24, 24))
    plt.imshow(arr.reshape(ndvi.shape), cmap=nbr_cmap)
    plt.axis('off')

    # storing on S3
    img_data = io.BytesIO()
    plt.savefig(img_data, format='png',
                bbox_inches='tight', transparent=True, pad_inches=0)
    img_data.seek(0)

    s3 = boto3.resource('s3', aws_access_key_id='ACCESS_KEY',
                        aws_secret_access_key='SECRET_KEY')
    bucket = s3.Bucket("deforestation-areas-1999")
    objectKey = str(uuid.uuid4()) + ".png"
    bucket.put_object(Body=img_data, ContentType='image/png', Key=objectKey)

    return objectKey


def saveColorImage(red, green, blue):
    """
    Renders the true color image using matplotlib.

    Parameters
    ----------
    red : ndarray
      Red band
    green : ndarray
      Green band
    blue : ndarray
      Blue band
    """

    fig, (ax1) = plt.subplots(1, 1, figsize=(24, 24))
    arr = np.array([red, green, blue])
    ep.plot_rgb(arr, ax=ax1)
    ax1.set_axis_off()
    plt.tight_layout()
    # storing on S3
    img_data = io.BytesIO()
    plt.savefig(img_data, format='png',
                bbox_inches='tight', transparent=True, pad_inches=0)
    img_data.seek(0)

    s3 = boto3.resource('s3', aws_access_key_id='ACCESS_KEY',
                        aws_secret_access_key='SECRET_KEY')
    bucket = s3.Bucket("deforestation-areas-1999")
    objectKey = str(uuid.uuid4()) + ".png"
    bucket.put_object(Body=img_data, ContentType='image/png', Key=objectKey)

    return objectKey


def calculateForestMask(green, ndvi):
    """
    Returns the forest mask as an binary array where 1 signifies that the coresponding pixel is part of a forest

    Parameters
    ----------
    green : ndarray
      Green band
    ndvi : ndarray
      Calculated NVDI
    """

    n_clusters = 4

    new_shape = (ndvi.shape[0] * ndvi.shape[1], 1)

    X = green.reshape(new_shape)

    k_means = cluster.KMeans(n_clusters)
    k_means.fit(X)
    clusters = k_means.labels_

    return clusters.reshape(ndvi.shape)


def imagesHandler(links_obj, lon, lat):
    """
    Based on a set of links corresponding to the red, green, blue and NIR bands, renders area defined by a polygon in true color and calculates forest mask.
    Both images are saved locally.

    Parameters
    ----------
    links_obj : dict
      Maps the keys "red", "green", "blue" and "nir" to a COG file URL, stored in a AWS S3 bucket
    lon : float
      Longitude of the center point
    lat : float
      Latitude of the center point
    """

    rectangle = buildRectangle(lon, lat)
    bbox = bounds(rectangle)

    red = getDataSubset(links_obj["red"], bbox)
    green = getDataSubset(links_obj["green"], bbox)
    blue = getDataSubset(links_obj["blue"], bbox)
    nir = getDataSubset(links_obj["nir"], bbox)

    ndvi = getNDVI(nir, red)
    mask = calculateForestMask(green, ndvi)
    mask_filename = saveMaskImage(mask, ndvi)
    color_filename = saveColorImage(red, green, blue)

    return mask_filename, color_filename


def lambda_handler(event, context):
    longitude = 0
    latitude = 0
    red = ""
    nir = ""
    green = ""
    blue = ""

    if "body" in event:
        event = json.loads(event["body"])

    if "red" in event:
        red = event["red"]

    if "nir" in event:
        nir = event["nir"]

    if "green" in event:
        green = event["green"]

    if "blue" in event:
        blue = event["blue"]

    if "longitude" in event:
        longitude = float(event["longitude"])

    if "latitude" in event:
        latitude = float(event["latitude"])

    mask_filename, image_filename = imagesHandler(
        {
            'red': red,
            'nir': nir,
            'green': green,
            'blue': blue
        }, longitude, latitude)

    return {
        'statusCode': 200,
        'message': "{\"mask_filename:\" " + mask_filename + ", \"image_filename\": " + image_filename + "}"
    }


lambda_handler({'red': 's3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B04.jp2',
                'nir': 's3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B08.jp2',
                'green': 's3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B03.jp2',
                'blue': 's3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B02.jp2',
                "longitude": "26.929263",
                "latitude": "45.401220"}, "")

# from math import sqrt,atan,pi
# import pyproj
# geod = pyproj.Geod(ellps='WGS84')

# def point():
#     width = 10000. # m
#     height = 20000. # m
#     rect_diag = sqrt( width**2 + height**2 )

#     center_lon = 26.929263
#     center_lat = 45.401220

#     azimuth1 = atan(width/height)
#     azimuth2 = atan(-width/height)
#     azimuth3 = atan(width/height)+pi # first point + 180 degrees
#     azimuth4 = atan(-width/height)+pi # second point + 180 degrees

#     pt1_lon, pt1_lat, _ = geod.fwd(center_lon, center_lat, azimuth1*180/pi, rect_diag)
#     pt2_lon, pt2_lat, _ = geod.fwd(center_lon, center_lat, azimuth2*180/pi, rect_diag)
#     pt3_lon, pt3_lat, _ = geod.fwd(center_lon, center_lat, azimuth3*180/pi, rect_diag)
#     pt4_lon, pt4_lat, _ = geod.fwd(center_lon, center_lat, azimuth4*180/pi, rect_diag)

#     wkt_point = 'POINT (%.6f %.6f)' % (center_lon, center_lat)
#     wkt_poly = 'POLYGON (( %.6f %.6f, %.6f %.6f, %.6f %.6f, %.6f %.6f, %.6f %.6f ))' % (pt1_lon, pt1_lat, pt2_lon, pt2_lat, pt3_lon, pt3_lat, pt4_lon, pt4_lat, pt1_lon, pt1_lat)
#     print(wkt_point)
#     print(wkt_poly)

# point()
