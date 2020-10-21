import Axios from 'axios'

export async function getNamespaces() {
    const result = await Axios.request({
        url: `${process.env.REACT_APP_BACKEND}/proxy/api/v1/namespaces`,
        responseType: 'json',
        withCredentials: true,
    })
    return result.data.items
}
