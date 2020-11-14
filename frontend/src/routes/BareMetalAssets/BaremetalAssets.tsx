import { AcmEmptyState, AcmPageCard } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React from 'react'
import { ClusterManagementPageHeader } from '../ClusterManagement/ClusterManagement'

export function BareMetalAssetsPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <BareMetalAssets />
        </Page>
    )
}

export function BareMetalAssets() {
    return (
        <AcmPageCard>
            <AcmEmptyState title="No bare metal assets found" message="No bare metal assets found" />
        </AcmPageCard>
    )
}
