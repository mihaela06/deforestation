import ToggleButton from '@mui/material/ToggleButton'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { setOriginalNode } from 'typescript'
import { ImageDisplay } from '../components/ImageDisplay'
import Loading from '../components/Loading'
import { TimeSlider } from '../components/TimeSlider'
import styles from '../styles/Timeline.module.css'
import { v4 as uuidv4 } from 'uuid'

interface ImageDetails {
  id: string
  dateTaken: Date
}

export default function TimelinePage () {
  const router = useRouter()
  const lat = router.query.lat
  const long = router.query.long
  console.log(lat, long)

  // TODO Treat case when query is empty

  const [dates, setDates] = useState<Array<ImageDetails>>([])
  const [currentImage, setCurrentImage] = useState('/images/loading.gif')
  const [currentMask, setCurrentMask] = useState('/images/loading.gif')
  const [toggledOverlay, setToggleOverlay] = useState<boolean>(false)
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [imagesLinks, setImagesLinks] = useState<Array<string>>([])
  const [masksLinks, setMasksLinks] = useState<Array<string>>([])
  const [loadedIndexes, setLoadedIndexes] = useState<Array<boolean>>([])

  const getDateFromUrl = (url: string) => {
    var arr = url.split('/')
    var year = arr[7]
    var month = arr[8]
    var day = arr[9]

    return new Date(year + '-' + month + '-' + day)
  }

  useEffect(() => {
    const getLinks = async () => {
      try {
        console.log('Getting links...')
        console.log(JSON.stringify({ latitude: lat, longitude: long }))

        const res = await fetch(
          `https://ekuqlpe5nl5e7xwooex7dnw6wy0xbgwq.lambda-url.us-east-1.on.aws/`,
          {
            method: 'POST',
            body: JSON.stringify({ latitude: lat, longitude: long })
          }
        )
          .then((res: Response) => res.text())
          .then(text => {
            console.log('first', text)

            var links = JSON.parse(text)['links']

            console.log(links)

            var dates = []
            var images = []
            var masks = []
            var loaded = []
    
            // var count = 0
            for (var i in links) {
              console.log('Getting images for ', getDateFromUrl(links[i]['red']))
              var uuidmask = uuidv4()
              var uuidimage = uuidv4()
    
              var obj = {
                red: links[i]['red'],
                nir: links[i]['nir'],
                green: links[i]['green'],
                blue: links[i]['blue'],
                longitude: long,
                latitude: lat,
                uuidimage: uuidimage,
                uuidmask: uuidmask
              }
              console.log('Sending body...', i, obj)
              dates.push({ id: i, dateTaken: getDateFromUrl(links[i]['red']) })
              masks.push(
                'https://deforestation-areas-1999.s3.us-east-1.amazonaws.com/' +
                  uuidmask +
                  '.png'
              )
              loaded.push(false)
              images.push(
                'https://deforestation-areas-1999.s3.us-east-1.amazonaws.com/' +
                  uuidimage +
                  '.png'
              )
    
              const getResult = (index: number) => {
                console.log("querying ", index);
                
                const res = fetch(
                  // `https://kqb3estgtebiejqsmtwuljib5q0eavap.lambda-url.us-east-1.on.aws/`, # dummy
                  `https://iqp32qnwke3vgosbz4r4slmcau0fcafk.lambda-url.us-east-1.on.aws/`,
                  {
                    method: 'POST',
                    body: JSON.stringify(obj)
                  }
                )
                  .then((res: Response) => res.text())
                  .then(text => {
                    console.log('Received response', text, i)
                    var newLoaded = loadedIndexes
                    newLoaded[index] = true
                    setLoadedIndexes(newLoaded)
                    console.log("loaded", newLoaded)
                  })
              }
    
              getResult(parseInt(i))
    
              // count++
              // if (count == 2) break
            }
    
            console.log(dates)
            console.log(masks)
            console.log(images)
            console.log(loaded)
            setDates(dates)
            setImagesLinks(images)
            setMasksLinks(masks)
            setLoadedIndexes(loaded)
    
            setSliderValue(dates[0].dateTaken.getTime())
            setCurrentImage(images[0])
            setCurrentMask(masks[0])
          })

        // var text = JSON.parse(
        //   '{ "links": [{"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2022/6/29/0/R10m/B02.jp2"}, {"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2021/7/14/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2021/7/14/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2021/7/14/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2021/7/14/0/R10m/B02.jp2"}, {"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2020/7/29/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2020/7/29/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2020/7/29/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2020/7/29/0/R10m/B02.jp2"}, {"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2019/8/29/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2019/8/29/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2019/8/29/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2019/8/29/0/R10m/B02.jp2"}, {"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2018/5/31/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2018/5/31/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2018/5/31/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2018/5/31/0/R10m/B02.jp2"}, {"red": "s3://sentinel-s2-l2a/tiles/35/T/ML/2017/6/30/0/R10m/B04.jp2", "nir": "s3://sentinel-s2-l2a/tiles/35/T/ML/2017/6/30/0/R10m/B08.jp2", "green": "s3://sentinel-s2-l2a/tiles/35/T/ML/2017/6/30/0/R10m/B03.jp2", "blue": "s3://sentinel-s2-l2a/tiles/35/T/ML/2017/6/30/0/R10m/B02.jp2"}]}'
        // )

        // var links = text['links']

      } catch (err) {
        console.log(err)
      }
    }

    if (lat !== undefined && long !== undefined) getLinks()
  }, [lat, long])

  function sliderChanged (
    _event: Event,
    value: number | number[],
    _activeThumb: number
  ) {
    if (value !== sliderValue)
      for (var i in dates) {
        if (dates[i].dateTaken.getTime() === value) {
          if (loadedIndexes[i]) {
            console.log(i, masksLinks[i], imagesLinks[i])

            setCurrentMask(masksLinks[i])
            setCurrentImage(imagesLinks[i])
          } else {
            console.log(i, masksLinks[i], imagesLinks[i], '/images/loading.gif')

            setCurrentMask('/images/loading.gif')
            setCurrentImage('/images/loading.gif')
          }
          setSliderValue(Number(value))
          break
        }
      }
  }

  useEffect(() => {
    console.log('current', currentImage)
  }, [currentImage])

  return (
    <div>
      <div>{!dates && <Loading />}</div>
      {dates && (
        <div
          style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              position: 'fixed',
              right: '5vw',
              top: '1vh',
              padding: '5px',
              display: 'flex',
              color: 'black',
              borderRadius: '10px',
              zIndex: '5'
            }}
          >
            <h3 style={{ margin: '10px' }}>Show overlay</h3>
            <ToggleButton
              value='check'
              color='primary'
              selected={toggledOverlay}
              onChange={() => {
                setToggleOverlay(!toggledOverlay)
              }}
              style={{ backgroundColor: 'rgba(240, 255, 255, 0.9)' }}
            >
              {toggledOverlay ? 'ON' : 'OFF'}
            </ToggleButton>
          </div>
          <div className={styles.imagedisplay} style={{ zIndex: '3' }}>
            <ImageDisplay source={currentImage} mask={false} />
          </div>
          <div className={styles.imagedisplay} style={{ zIndex: '4' }}>
            {toggledOverlay && (
              <ImageDisplay source={currentMask} mask={true} />
            )}
          </div>
          <div className={styles.imagedisplay} style={{ zIndex: '2' }}>
            {toggledOverlay && (
              <ImageDisplay source='/images/loading.gif' mask={false} />
            )}
          </div>
        </div>
      )}
      <div className={styles.timeslider} style={{ zIndex: '10' }}>
        <TimeSlider
          dates={dates?.map(d => d.dateTaken)}
          sliderChanged={sliderChanged}
        />
      </div>
    </div>
  )
}
