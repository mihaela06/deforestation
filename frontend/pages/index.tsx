import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Router from 'next/router'

export default function Home () {
  const submitCoordinates = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formElements = form.elements as typeof form.elements & {
      lat: HTMLInputElement
      long: HTMLInputElement
    }
    Router.push({
      pathname: '/timeline',
      query: { lat: formElements.lat.value, long: formElements.long.value }
    })
  }

  return (
    <>
      <Head>
        <title>Deforestation</title>
        <meta name='description' content='Visualise deforestation progress' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <div className={styles.background}>
          <form
            action='/timeline'
            method='post'
            className={styles.form}
            onSubmit={submitCoordinates}
          >
            <input
              type='number'
              step='.01'
              min='-90'
              max='90'
              id='lat'
              name='lat'
              placeholder='Latitude'
              required
            />
            <input
              type='number'
              step='.01'
              min='-180'
              max='180'
              id='long'
              name='long'
              placeholder='Longitude'
              required
            />
            <button type='submit'>Get timeline</button>
          </form>
        </div>
      </main>
    </>
  )
}
