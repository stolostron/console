import { Button } from '@patternfly/react-core'
import React, { ReactNode } from 'react'

export function AcmButton(props: { children: ReactNode }) {
    return <Button>{props.children}</Button>
}
