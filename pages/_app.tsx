import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import { Provider, atom, useAtom } from 'jotai';

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  )
}

export default MyApp
