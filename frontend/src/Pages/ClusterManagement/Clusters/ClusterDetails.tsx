import { AcmPageHeader } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React from 'react'
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
