import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ImageDisplay } from '../components/ImageDisplay'
import Loading from '../components/Loading'
import { TimeSlider } from '../components/TimeSlider'
import styles from '../styles/Timeline.module.css'

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

  useEffect(() => {
    let date1 = { id: '1', dateTaken: new Date('2022-06-13') }
    let date2 = { id: '2', dateTaken: new Date('2021-06-13') }
    let date3 = { id: '3', dateTaken: new Date('2021-07-13') }
    setDates([date1, date2, date3])
    setCurrentImage(
      'https://cdn.britannica.com/25/160325-050-EB1C8FB7/image-instruments-Earth-satellite-NASA-Suomi-National-2012.jpg'
    )
    // slider is not firing its first position
  }, [])

  function sliderChanged (
    _event: Event,
    value: number | number[],
    _activeThumb: number
  ) {
    var link: string
    console.log(value)
    if (value == 1623542400000)
      link =
        'https://cdn.britannica.com/25/160325-050-EB1C8FB7/image-instruments-Earth-satellite-NASA-Suomi-National-2012.jpg'
    else if (value == 1655078400000)
      link = 'https://www.gstatic.com/earth/social/00_generic_facebook-001.jpg'
    else
      link =
        'https://www.worldatlas.com/r/w1300-q80/upload/7d/db/c3/shutterstock-1558058690.jpg'
    if (link !== currentImage) {
      setCurrentImage(link)
      console.log(link)
    }
  }

  return (
    <div>
      <div>{!dates && <Loading />}</div>
      <div className={styles.imagedisplay}>
        {dates && <ImageDisplay source={currentImage} />}
      </div>
      <div className={styles.timeslider}>
        <TimeSlider
          dates={dates?.map(d => d.dateTaken)}
          sliderChanged={sliderChanged}
        />
      </div>
    </div>
  )
}
