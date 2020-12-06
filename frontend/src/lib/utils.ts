import get from 'get-value'

export function getLatest<T>(items: T[], key: string) {
    if (items.length === 0) {
        return undefined
    }
    if (items.length === 1) {
        return items[0]
    }

    return items.reduce((a, b) => {
        const [timeA, timeB] = [a, b].map((x: T) => new Date(get((x as unknown) as object, key, '')))
        return timeA > timeB ? a : b
    })
}

export const createDownloadFile = (filename: string, content: string, type?: string) => {
    const a = document.createElement('a')
    const blob = new Blob([content], { type: type || 'text/plain' })
    const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    a.dispatchEvent(event)
    window.URL.revokeObjectURL(url)
}
