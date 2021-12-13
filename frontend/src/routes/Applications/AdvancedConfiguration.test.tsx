/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { channelsState, subscriptionsState } from '../../atoms'
import { NavigationPath } from '../../NavigationPath'
import {
    Channel,
    ChannelApiVersion,
    ChannelKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
} from '../../resources'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { clickByTestId, waitForText } from '../../lib/test-util'
import AdvancedConfiguration from './AdvancedConfiguration'

let testLocation: Location

const mockSubscription1: Subscription = {
    kind: SubscriptionKind,
    apiVersion: SubscriptionApiVersion,
    metadata: {
        name: 'helloworld-simple-subscription-1',
        namespace: 'helloworld-simple-ns',
        uid: 'fd3dfc08-5d41-4449-b450-527bebc2509d',
    },
    spec: {
        channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
        placement: {
            placementRef: {
                kind: 'PlacementRule',
                name: 'helloworld-simple-placement-1',
            },
        },
    },
}
const mockSubscription2: Subscription = {
    kind: SubscriptionKind,
    apiVersion: SubscriptionApiVersion,
    metadata: {
        name: 'helloworld-simple-subscription-2',
        namespace: 'helloworld-simple-ns',
        uid: 'fd3dfc08-5d41-4449-b450-527bebc2509d',
    },
    spec: {
        channel: 'ggithubcom-app-samples-ns/ggithubcom-app-samples',
        placement: {
            placementRef: {
                kind: 'PlacementRule',
                name: 'helloworld-simple-placement-2',
            },
        },
    },
}

const mockChannel1: Channel = {
    kind: ChannelKind,
    apiVersion: ChannelApiVersion,
    metadata: {
        name: 'ggithubcom-app-samples',
        namespace: 'ggithubcom-app-samples-ns',
        uid: '5ffea57f-a6a0-4a05-9606-3f1bb75ccdab',
    },
    spec: {
        pathname: 'https://github.com/fxiang1/app-samples.git',
        type: 'Git',
    },
}

const mockChannel2: Channel = {
    kind: ChannelKind,
    apiVersion: ChannelApiVersion,
    metadata: {
        name: 'ggithubcom-app-samples2',
        namespace: 'ggithubcom-app-samples2-ns',
        uid: '5ffea57f-a6a0-4a05-9606-3f1bb75ccdab',
    },
    spec: {
        pathname: 'https://github.com/fxiang1/app-samples.git',
        type: 'Git',
    },
}

const mockChannels = [mockChannel1, mockChannel2]
const mockSubscriptions = [mockSubscription1, mockSubscription2]

function TestAdvancedConfigurationPage(props: { subscriptions?: Subscription[]; channels?: Channel[] }) {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(subscriptionsState, props.subscriptions || [])
                snapshot.set(channelsState, props.channels || [])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.advancedConfiguration]}>
                <Route
                    path={NavigationPath.advancedConfiguration}
                    render={(props: any) => {
                        testLocation = props.location
                        return <AdvancedConfiguration {...props} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('advanced configuration page', () => {
    beforeEach(nockIgnoreRBAC)

    test('should render the table with subscriptions', async () => {
        render(<TestAdvancedConfigurationPage subscriptions={mockSubscriptions} />)
        await waitForText(mockSubscription1.metadata!.name!)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.advancedConfiguration))
    })

    test('should render the table with channels', async () => {
        render(<TestAdvancedConfigurationPage channels={mockChannels} />)
        await clickByTestId('channels')
        // this would cause failure
        // await waitForText(mockChannel1.metadata!.name!)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.advancedConfiguration))
    })

    test('should render the table with placements', async () => {
        render(<TestAdvancedConfigurationPage />)
        await clickByTestId('placements')
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.advancedConfiguration))
    })

    test('should render the table with placement rules', async () => {
        render(<TestAdvancedConfigurationPage />)
        await clickByTestId('placementrules')
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.advancedConfiguration))
    })
})
