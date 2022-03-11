/* Copyright Contributors to the Open Cluster Management project */
import { Grid, GridItem, gridSpans } from '@patternfly/react-core'
import useResizeObserver from '@react-hook/resize-observer'
import { Children, ReactNode, useMemo, useRef, useState } from 'react'

export function AcmDynamicGrid(props: { children: ReactNode; minSize?: number; maxColumns?: number }) {
    const minSize = props.minSize ?? 700
    const ref = useRef(null)
    const [columnCount, setColumnCount] = useState(1)

    useResizeObserver(ref, (entry) => {
        let columns = 1
        while ((columns + 1) * minSize + columns * 16 < entry.contentRect.width) {
            columns++
        }
        if (props.maxColumns && columns > props.maxColumns) columns = props.maxColumns
        setColumnCount(columns)
    })

    const spanPerColumn = useMemo(() => Math.floor(12 / columnCount) as gridSpans, [columnCount])

    return (
        <div ref={ref} style={{ display: 'flex', width: '100%' }}>
            <Grid hasGutter>
                {Children.map(props.children, (child, index) => (
                    <GridItem key={index} span={spanPerColumn}>
                        {child}
                    </GridItem>
                ))}
            </Grid>
        </div>
    )
}
