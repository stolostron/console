/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useMemo } from 'react'
import Masonry from 'react-masonry-css'
import './AcmMasonry.css'

const sideBarSize = 290
const sideBarBreakpoint = 1200

export function AcmMasonry(props: { children: ReactNode; minSize?: number }) {
    const minSize = props.minSize ?? 700

    const breakpointCols = useMemo(() => {
        const breakpointCols: Record<string, number> = {}
        let t = minSize
        let count = 1
        while (t < sideBarBreakpoint) {
            breakpointCols[t] = count++
            t += minSize
        }
        t += sideBarSize
        while (t < 3440) {
            breakpointCols[t] = count++
            t += minSize
        }
        return breakpointCols
    }, [])

    return (
        <Masonry breakpointCols={breakpointCols} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
            {props.children}
        </Masonry>
    )
}
