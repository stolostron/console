/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmErrorBoundary } from './AcmErrorBoundary'

export default {
    title: 'ErrorBoundary',
    component: AcmErrorBoundary,
}

export const ErrorBoundary = () => {
    return (
        <AcmErrorBoundary actions={<AcmButton>Refresh page</AcmButton>}>
            <ErrorButton />
            <div>Hello</div>
        </AcmErrorBoundary>
    )
}

const ErrorButton = () => {
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        if (error) {
            const object = '{"foo": "ba}'
            JSON.parse(object)
        }
    }, [error])

    return <AcmButton onClick={() => setError(true)}>Throw error</AcmButton>
}
