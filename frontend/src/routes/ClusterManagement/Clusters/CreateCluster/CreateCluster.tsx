import { AcmPage, AcmPageHeader } from '@open-cluster-management/ui-components'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'

export default function CreateClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage>
            <AcmPageHeader title="Create Cluster" breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }]} />
        </AcmPage>
    )
}
