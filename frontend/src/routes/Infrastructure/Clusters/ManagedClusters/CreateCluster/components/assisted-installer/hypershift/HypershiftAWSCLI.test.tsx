/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { waitForText } from '../../../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { HypershiftAWSCLI } from './HypershiftAWSCLI'

describe('HypershiftAWSCLI', () => {
    const Component = () => {
        return (
            <RecoilRoot>
                <MemoryRouter initialEntries={[NavigationPath.createAWSCLI]}>
                    <Route path={NavigationPath.createAWSCLI}>
                        <HypershiftAWSCLI />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    test('should show all the steps', async () => {
        render(<Component />)
        await waitForText('Prerequisite')
        await waitForText('AWS Credentials')
        await waitForText('Hosted control plane command')
    })
})
