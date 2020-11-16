import { AcmEmptyState, AcmPageCard, AcmPageHeader } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React from 'react'

export default function BareMetalAssetsPage() {
    return (
        <Page>
            <AcmPageHeader title={'Bare-metal Assets'} />
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
