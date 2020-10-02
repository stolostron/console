import { Page } from '@patternfly/react-core'
import React from 'react'
import { AcmPageHeader } from '../../../components/AcmPage'

export function ClusterDetailsPage() {
    return (
        <Page>
            <AcmPageHeader title="Cluster Details" />
            <ClustersDeatilsPageContent />
        </Page>
    )
}

export function ClustersDeatilsPageContent() {
    return <div></div>
}
