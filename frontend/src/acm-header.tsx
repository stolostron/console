import Axios, { AxiosResponse } from 'axios'

declare global {
    interface Window {
      __PRELOADED_STATE__: object
    }
  }

const fetchHeader = async () => {
    let headerResponse: AxiosResponse
    try {
        headerResponse = await Axios.request({
            url: `${process.env.REACT_APP_BACKEND}/cluster-management/header`,
            method: 'GET',
            responseType: 'json',
            withCredentials: true
        })

        console.log('headerResponse', headerResponse)

        if (headerResponse.status === 200) {
            const { headerHtml, files, props, state } = headerResponse.data

            const head = document.querySelector('head')
            const body = document.querySelector('body')
    
            const headerContainer = document.createElement('div')
            headerContainer.id = 'header'
            headerContainer.innerHTML = headerHtml
            body?.prepend(headerContainer)
            
            const propScript = document.createElement('script')
            propScript.id = 'props'
            propScript.type ='application/json'
            propScript.innerHTML = props
    
            window.__PRELOADED_STATE__ = state
    
            Object.values(files as object).forEach(({ path }) => {
                if (path.endsWith('css')) {
                    const link = document.createElement('link')
                    link.rel = 'stylesheet'
                    link.href = `${process.env.REACT_APP_BACKEND}${path}`
                    head?.appendChild(link)
                } else {
                    const script = document.createElement('script')
                    script.src = `${process.env.REACT_APP_BACKEND}${path}`
                    body?.appendChild(script)
                }
            })
        }
    } catch(err) {
        console.error(err)
    }
}

fetchHeader()
