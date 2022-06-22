/* Copyright Contributors to the Open Cluster Management project */

/* istanbul ignore file */

import { useState, useEffect } from 'react'
import { Grid, GridItem } from '@patternfly/react-core'

export function AcmChartGroup(props: { children: React.ReactNode[] }) {
    return (
        <Grid hasGutter lg={4} md={6} sm={12}>
            {props.children.map((child, i) => (
                <GridItem key={`chart-group-item-${i}`}>{child}</GridItem>
            ))}
        </Grid>
    )
}

export function useViewport() {
    const [viewWidth, setWidth] = useState<number>(window.innerWidth)

    useEffect(() => {
        const handleWindowResize = () => setWidth(window.innerWidth)
        window.addEventListener('resize', handleWindowResize)
        return () => window.removeEventListener('resize', handleWindowResize)
    }, [])

    return { viewWidth }
}
