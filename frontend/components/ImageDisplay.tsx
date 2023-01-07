interface ImageDisplayProps {
  source: string
}

export const ImageDisplay = (props: ImageDisplayProps) => {
  return <img src={props.source}></img>
}
