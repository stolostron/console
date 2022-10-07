/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmPageProcess } from './AcmPageProcess'
import { AcmButton } from '../AcmButton/AcmButton'

describe('AcmPageProcess', () => {
    const PageProcess = () => {
        const [isLoading, setIsLoading] = useState<boolean>(true)

        useEffect(() => {
            setTimeout(() => setIsLoading(false), 750)
        }, [])

        return (
            <AcmPageProcess
                isLoading={isLoading}
                loadingTitle="Destroying"
                loadingMessage="Destroying resource"
                successTitle="Resource destroyed"
                successMessage="Resource was destroyed"
                primaryAction={<AcmButton>Back to Cluster management</AcmButton>}
                secondaryActions={
                    <>
                        <AcmButton variant="link">Create a new cluster</AcmButton>
                        <AcmButton variant="link">Import a new cluster</AcmButton>
                    </>
                }
            />
        )
    }

    test('renders', async () => {
        const { getByText } = render(<PageProcess />)
        expect(getByText('Destroying')).toBeInTheDocument()
        expect(getByText('Destroying resource')).toBeInTheDocument()
        await waitFor(() => expect(getByText('Resource destroyed')).toBeInTheDocument())
        expect(getByText('Resource was destroyed')).toBeInTheDocument()
        expect(getByText('Back to Cluster management')).toBeInTheDocument()
        expect(getByText('Create a new cluster')).toBeInTheDocument()
    })
    test('has zero accessibility defects', async () => {
        // don't test loading because it's covered in AcmLoadingPage
        const { container } = render(<AcmPageProcess isLoading={false} />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
