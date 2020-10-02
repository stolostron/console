import { Form } from '@patternfly/react-core'
import React, { ReactNode } from 'react'

export function AcmForm(props: { children: ReactNode }) {
    return <Form>{props.children}</Form>
}
