import { AcmEmptyState, AcmPageCard, AcmPageHeader } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React from 'react'
import { useTranslation } from 'react-i18next'

export default function BareMetalAssetsPage() {
    const { t } = useTranslation(['bma'])
    return (
        <Page>
            <AcmPageHeader title={t('bmas')} />
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
