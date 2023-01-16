import satsearch
from rasterio.features import bounds


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


def linksHandler(lon, lat, delta_lon=0.0275, delta_lat=0.01):
    """
    Returns an array of links (four for each year, corresponding to the red, green, blue and NIR bands)

    Parameters
    ----------
    lon : float
      Longitude of the center point
    lat : float
      Latitude of the center point
    deltalon : float
      Rectangle height (in degrees) (optional, defaults to 0.0275)
    deltalat : float
      Rectangle width (in degrees) (optional, defaults to 0.01)
    """

    rectangle = buildRectangle(lon, lat, delta_lon, delta_lat)
    return getImageLinks(rectangle)


def getImageLinks(rectangle):
    """
    Returns an array of links (four for each year, corresponding to the red, green, blue and NIR bands)

    Parameters
    ----------
    lon : float
      Longitude of the center point
    lat : float
      Latitude of the center point
    deltalon : float
      Rectangle height (in degrees) (optional, defaults to 0.0275)
    deltalat : float
      Rectangle width (in degrees) (optional, defaults to 0.01)
    """

    SentinelSearch = satsearch.Search.search(
        url="https://earth-search.aws.element84.com/v0",
        bbox=bounds(rectangle),
        query={"eo:cloud_cover": {"lt": 10},
               "sentinel:valid_cloud_cover": {"eq": True}},
        collections=['sentinel-s2-l2a'])

    sentinel_items = SentinelSearch.items()

    items = []
    years = set()
    months = dict()
    selected_month = dict()

    for item in sentinel_items:
        list_split = item.assets['B04']['href'].split('/')
        year = list_split[7]
        month = list_split[8]
        day = list_split[9]
        if year not in years:
            years.add(year)
            months[year] = set()
        else:
            months[year].add(month)

    month_order = ['6', '7', '5', '8', '4',
                   '3', '9', '10', '11', '12', '2', '1']

    for year, months in months.items():
        for m in month_order:
            if m in months:
                selected_month[year] = m
                break

    links = []

    for item in sentinel_items:
        red_s3 = item.assets['B04']['href']
        blue_s3 = item.assets['B02']['href']
        green_s3 = item.assets['B03']['href']
        nir_s3 = item.assets['B08']['href']
        list_split = item.assets['B04']['href'].split('/')
        year = list_split[7]
        month = list_split[8]
        day = list_split[9]
        if year in selected_month:
            if month == selected_month[year]:
                del selected_month[year]
                links.append({'red': red_s3, 'nir': nir_s3,
                             'green': green_s3, 'blue': blue_s3})

    return links


links = linksHandler(26.929263, 45.401220)
print(links)
