/* Copyright Contributors to the Open Cluster Management project */

//as scale decreases from max to min, return a counter zoomed value from min to max
export const counterZoom = (scale: number, scaleMin: number, scaleMax: number, valueMin: number, valueMax: number) => {
    if (scale >= scaleMax) {
        return valueMin
    } else if (scale <= scaleMin) {
        return valueMax
    }
    return valueMin + (1 - (scale - scaleMin) / (scaleMax - scaleMin)) * (valueMax - valueMin)
}
