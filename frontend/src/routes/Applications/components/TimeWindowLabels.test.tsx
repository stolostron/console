/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { Subscription, SubscriptionApiVersion, SubscriptionKind } from '../../../resources'
import { TimeWindowLabels } from './TimeWindowLabels'

//////////////// Test /////////////////

describe('TimeWindowLabels', () => {
    it('should render empty messages', async () => {
        const sub: Subscription = {
            apiVersion: SubscriptionApiVersion,
            kind: SubscriptionKind,
            spec: {},
            metadata: {
                name: 'test',
            },
        }
        const { container } = render(
            <TimeWindowLabels
                subName={sub.metadata.name as string}
                type={sub.spec.timewindow?.windowtype as string}
                days={sub.spec.timewindow?.daysofweek as string[]}
                timezone={sub.spec.timewindow?.location}
                missingData={sub.spec.timewindow?.missingData}
            />
        )
        expect(container.getElementsByClassName('timeWindow-status-icon').length).toBe(1)
    })

    it('should show block', async () => {
        const sub: Subscription = {
            apiVersion: SubscriptionApiVersion,
            kind: SubscriptionKind,
            spec: {
                timewindow: {
                    daysofweek: ['Sunday', 'Saturday'],
                    hours: [],
                    location: 'America/Toronto',
                    windowtype: 'blocked',
                },
            },
            metadata: {
                name: 'test',
            },
        }
        const { getByText } = render(
            <TimeWindowLabels
                subName={sub.metadata.name as string}
                type={sub.spec.timewindow?.windowtype as string}
                days={sub.spec.timewindow?.daysofweek as []}
                timezone={sub.spec.timewindow?.location}
                ranges={sub.spec.timewindow?.hours}
                missingData={sub.spec.timewindow?.missingData}
            />
        )
        expect(getByText('blocked')).toBeTruthy()
    })
})
