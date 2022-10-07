/* Copyright Contributors to the Open Cluster Management project */

export type HumanizedSortable = {
    title: string | React.ReactNode
    sortableValue: number | string
}

export const getHumanizedDateTime = (dateTime?: string) => {
    if (!dateTime) return '-'
    const date = new Date(dateTime)
    return date.toLocaleString()
}

export const getHumanizedTime = (dateTime?: string) => {
    if (!dateTime) return '-'
    const date = new Date(dateTime)
    return date.toLocaleTimeString()
}

export const getDateTimeCell = (time?: string): HumanizedSortable => {
    const date = getHumanizedDateTime(time)
    return {
        title: date,
        sortableValue: time ? new Date(time).getTime() : 0,
    }
}
