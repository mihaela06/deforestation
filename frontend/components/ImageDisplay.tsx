import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

interface ImageDisplayProps {
  source: string
  mask: boolean
}

export const ImageDisplay = (props: ImageDisplayProps) => {
  const [retryCounter, setRetryCounter] = useState(10)
  const [src, setSrc] = useState(props.source)
  console.log('source ', src, props.mask)

  useEffect(() => {
    setSrc(props.source)
    console.log("Set source ", props.source);
    
  }, [props.source])

  const onImageLoaded = useCallback(() => {
    console.log('Image loaded!', src, props.mask)
  }, [])

  const onImageError = useCallback(() => {
    if (retryCounter > 0) {
      // await new Promise(r => setTimeout(r, 1000))
      console.log('Retrying to load ', props.source, retryCounter)

      setSrc(props.source)
      setRetryCounter(retryCounter - 1)
    } else setSrc('/images/error.gif')
  }, [])

  if (!props.mask)
    return (
      <Image
        src={src}
        alt='Satellite'
        placeholder='blur'
        blurDataURL='/images/loading.gif'
        onError={onImageError}
        onLoad={onImageLoaded}
        fill
      ></Image>
    )
  else
    return (
      <Image
        style={{ filter: 'opacity(0.3)' }}
        src={src}
        alt='Mask'
        placeholder='blur'
        blurDataURL='/images/loading.gif'
        onError={onImageError}
        onLoad={onImageLoaded}
        fill
      ></Image>
    )
}
