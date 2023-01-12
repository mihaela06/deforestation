import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ImageDisplay } from '../components/ImageDisplay'
import Loading from '../components/Loading'
import { TimeSlider } from '../components/TimeSlider'
import styles from '../styles/Timeline.module.css'
import CheckIcon from '@mui/icons-material/Check'

interface ImageDetails {
  id: string // jobId, get status from another api similar to tts azure
  dateTaken: Date
}

export default function TimelinePage () {
  const router = useRouter()
  const lat = router.query.lat
  const long = router.query.long
  // TODO Treat case when query is empty

  console.log(lat, long)

  const [dates, setDates] = useState<Array<ImageDetails> | undefined>(undefined)
  const [currentImage, setCurrentImage] = useState('')
  const [viewMode, setViewMode] = useState<string | null>('Processed')
  const [toggledNDVI, setToggledNDVI] = useState<boolean>(true)
  const [toggledLegend, setToggledLegend] = useState<boolean>(true)
  const [sliderValue, setSliderValue] = useState<number>(0)

  let getNDVIName: (date: Date) => string = function (date: Date): string {
    var out: string
    out =
      'images/' +
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString() +
      date.getDate().toString() +
      '.png'
    console.log(out, date)
    return out
  }

  let getSatelliteName: (date: Date) => string = function (date: Date): string {
    var out: string
    out =
      'images/color_' +
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString() +
      date.getDate().toString() +
      '.png'
    console.log(out, date)
    return out
  }

  useEffect(() => {
    let dates = [
      { id: '1', dateTaken: new Date('2017-06-30') },
      { id: '2', dateTaken: new Date('2018-05-31') },
      { id: '3', dateTaken: new Date('2019-08-29') },
      { id: '4', dateTaken: new Date('2020-07-29') },
      { id: '5', dateTaken: new Date('2021-07-14') },
      { id: '6', dateTaken: new Date('2022-06-29') }
    ]
    setDates(dates)
    setCurrentImage(getNDVIName(dates[0].dateTaken))
    setSliderValue(dates[0].dateTaken.getTime())
  }, [])

  function sliderChanged (
    _event: Event,
    value: number | number[],
    _activeThumb: number
  ) {
    var link: string
    if (toggledNDVI) link = getNDVIName(new Date(Number(value)))
    else link = getSatelliteName(new Date(Number(value)))

    console.log(link)

    if (link !== currentImage) {
      setSliderValue(Number(value))
      setCurrentImage(link)
      console.log(link)
    }
  }

  const handleViewMode = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null
  ) => {
    setViewMode(newAlignment)
    if (toggledNDVI) setCurrentImage(getSatelliteName(new Date(sliderValue)))
    else setCurrentImage(getNDVIName(new Date(sliderValue)))
    setToggledNDVI(!toggledNDVI)
  }

  return (
    <div>
      <div>{!dates && <Loading />}</div>
      {dates && (
        <div className={styles.imagedisplay}>
          <div style={{ position: 'fixed', left: '5vw', top: '1vh' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewMode}
              style={{ backgroundColor: 'rgba(240, 255, 255, 0.4)' }}
            >
              <ToggleButton value='Processed'>Processed</ToggleButton>
              <ToggleButton value='Satellite'>Satellite</ToggleButton>{' '}
            </ToggleButtonGroup>
          </div>
          {toggledNDVI && (
            <div
              style={{
                backgroundColor: 'rgba(240, 255, 255, 0.4)',
                position: 'fixed',
                right: '5vw',
                top: '1vh',
                padding: '5px',
                display: 'flex',
                color: 'black',
                borderRadius: '10px'
              }}
            >
              <h3 style={{ margin: '10px' }}>Show legend</h3>
              <ToggleButton
                value='check'
                selected={toggledLegend}
                onChange={() => {
                  setToggledLegend(!toggledLegend)
                }}
              >
                <CheckIcon />
              </ToggleButton>
            </div>
          )}
          {toggledNDVI && toggledLegend && (
            <img
              style={{
                position: 'fixed',
                height: '100px',
                left: '5vw',
                top: '10vh'
              }}
              src='images/legend.png'
            ></img>
          )}
          <ImageDisplay source={currentImage} />
        </div>
      )}
      <div className={styles.timeslider}>
        <TimeSlider
          dates={dates?.map(d => d.dateTaken)}
          sliderChanged={sliderChanged}
        />
      </div>
    </div>
  )
}
