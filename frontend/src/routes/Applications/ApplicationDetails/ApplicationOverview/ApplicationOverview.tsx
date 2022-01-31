/* Copyright Contributors to the Open Cluster Management project */

import { AcmDescriptionList, AcmExpandableCard, AcmPageContent, ListItems } from '@stolostron/ui-components'
import { useTranslation } from '../../../../lib/acm-i18next'
import { PageSection, Split } from '@patternfly/react-core'
import { useRecoilState } from 'recoil'
import { applicationSetsState, applicationsState, argoApplicationsState } from '../../../../atoms'
import { getShortDateTime } from '../../helpers/resource-helper'
import _ from 'lodash'
import moment from 'moment'

export function ApplicationOverviewPageContent(props: { name: string; namespace: string }) {
    const { name, namespace } = props
    const [applications] = useRecoilState(applicationsState)
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [argoApplications] = useRecoilState(argoApplicationsState)

    const selectedApplication = applications.filter(
        (application) => application.metadata.name === name && application.metadata.namespace === namespace
    )

    // subscriptions only
    const leftItems: ListItems[] = [
        {
            key: 'Name',
            value: name,
        },
        {
            key: 'Namespace',
            value: namespace,
        },
        {
            key: 'Created',
            value: getShortDateTime(_.get(selectedApplication[0], 'metadata.creationTimestamp')),
        },
        {
            key: 'Last sync requested',
        },
    ]

    function ApplicationDetails() {
        const { t } = useTranslation()
        return <AcmDescriptionList title={t('Details')} leftItems={leftItems} rightItems={[]}></AcmDescriptionList>
    }

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <ApplicationDetails />
            </PageSection>
        </AcmPageContent>
    )
}

// export const getShortDateTime = (timestamp: string, now = null) => {
//     const timeFormat = 'h:mm a'
//     const monthDayFormat = 'MMM D'
//     const yearFormat = 'YYYY'
//     if (!timestamp) {
//         return '-'
//     }
//     if (!now) {
//         now = moment()
//     }
//     const date = getMoment(timestamp)
//     if (date.isSame(now, 'day')) {
//         return date.format(timeFormat)
//     } else if (date.isSame(now, 'year')) {
//         return date.format(`${monthDayFormat}, ${timeFormat}`)
//     } else {
//         return date.format(`${monthDayFormat} ${yearFormat}, ${timeFormat}`)
//     }
// }
