/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { StatusType } from '@open-cluster-management/ui-components'
import { ProgressStepBar } from './ProgressStepBar'
import { clickByLabel, clickByText, waitForText, waitForNock, waitForNocks } from '../../../../lib/test-util'


const installStatusSteps = [
    {
        active: true,
        statusType: StatusType.progress,
        statusText: 'Pre-creation jobs',
        statusSubtitle: 'In progress',
    },
    {
        active: true,
        statusType: StatusType.pending,
        statusText: 'Cluster install',
        statusSubtitle: 'Pending',
    },
    {
        active: true,
        statusType: StatusType.pending,
        statusText: 'Klusterlet install',
        statusSubtitle: 'Pending',
    },
    {
        active: true,
        statusType: StatusType.pending,
        statusText: 'Post-creation jobs',
        statusSubtitle: 'Pending',
    },
]

describe('ProgressStepBar', () => {
    test('renders progress bar', async () => {
        render(
            <ProgressStepBar
                title="Install in progress"
                subtitle={`1 of 4 steps complete`}
                steps={installStatusSteps}
                isCentered={true}
            />
        )

        await waitForText('Pre-creation jobs')
        await waitForText('In progress')
        await waitForText('Klusterlet install')
        await waitForText('Post-creation jobs')

    })
})
