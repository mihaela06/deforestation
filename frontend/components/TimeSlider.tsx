import { Slider } from '@mui/material'

interface SliderMark {
  value: number // unix time
  label: string
}

interface TimeSliderProps {
  dates: Array<Date> | undefined,
  sliderChanged: (event: Event, value: number | number[], activeThumb: number) => void
}

function getLabel (value: number) {
  var date = new Date(value)
  return (date.getMonth() + 1) + '/' + date.getFullYear()
}

export const TimeSlider = (props: TimeSliderProps) => {
  var dates = props.dates
  var marks: Array<SliderMark> = []
  dates?.forEach(date => {
    var unixTime = date.getTime()
    marks.push({ value: unixTime, label: getLabel(unixTime) })
  })
  marks.sort((a, b) => a.value - b.value)

  return (
    <div >
      {
        <Slider
          min={marks?.at(0)?.value}
          max={marks?.at(-1)?.value}
          marks={marks}
          step={null}
          disabled={marks.length == 0}
          value={marks?.at(0)?.value}
          onChange={props.sliderChanged}
        />
      }
    </div>
  )
}
