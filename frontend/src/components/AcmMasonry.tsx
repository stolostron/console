/* Copyright Contributors to the Open Cluster Management project */
import { Stack, StackItem } from '@patternfly/react-core'
import useResizeObserver from '@react-hook/resize-observer'
import { Children, ReactNode, useMemo, useRef, useState } from 'react'

export function AcmMasonry(props: { children: ReactNode; minSize?: number }) {
    const minSize = props.minSize ?? 700
    const ref = useRef(null)
    const [columnCount, setColumnCount] = useState(1)

    useResizeObserver(ref, (entry) => {
        let columns = 1
        while ((columns + 1) * minSize + columns * 16 < entry.contentRect.width) {
            columns++
        }
        setColumnCount(columns)
    })

    const columns = useMemo(() => {
        const columns: ReactNode[][] = new Array(columnCount).fill([]).map(() => [])
        Children.forEach(props.children, (child, index) => {
            columns[index % columnCount].push(child)
        })
        console.log(columns)
        return columns
    }, [columnCount, props.children])

    return (
        <div ref={ref} style={{ display: 'flex', width: '100%', columnGap: 16 }}>
            {columns.map((column, index) => (
                <div style={{ flex: 1 }} key={index}>
                    <Stack hasGutter>
                        {column.map((child, index) => (
                            <StackItem key={index}>{child}</StackItem>
                        ))}
                    </Stack>
                </div>
            ))}
        </div>
    )
}
