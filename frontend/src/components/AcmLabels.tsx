import { Label } from '@patternfly/react-core'
import '@patternfly/react-core/dist/styles/base.css'
import React, { Fragment } from 'react'

export function AcmLabels(props: { labels: string[] }) {
    return (
        <Fragment>
            {props.labels?.map((label) => (
                <Fragment key={label}>
                    <Label key={label} style={{ margin: 1 }}>
                        {label}
                    </Label>
                </Fragment>
            ))}
        </Fragment>
    )
}
