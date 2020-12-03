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
