/* Copyright Contributors to the Open Cluster Management project */

import { Addon, AddonStatus } from '../../../../../../resources'
import { AcmInlineStatus, AcmPageContent, AcmTable, StatusType } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ClusterContext } from '../ClusterDetails'

export function ClustersSettingsPageContent() {
    const { addons } = useContext(ClusterContext)
    return (
        <AcmPageContent id="addons">
            <PageSection>
                <ClusterSettingsTable addons={addons} />
            </PageSection>
        </AcmPageContent>
    )
}

export function ClusterSettingsTable(props: { addons: Addon[] | undefined }) {
    const { t } = useTranslation()
    return (
        <AcmTable<Addon>
            plural="add-ons"
            items={props.addons}
            columns={[
                {
                    header: t('Name'),
                    sort: 'name',
                    search: 'name',
                    cell: 'name',
                },
                {
                    header: t('Status'),
                    cell: (item: Addon) => {
                        let type
                        switch (item.status) {
                            case AddonStatus.Available:
                                type = StatusType.healthy
                                break
                            case AddonStatus.Degraded:
                                type = StatusType.danger
                                break
                            case AddonStatus.Progressing:
                                type = StatusType.progress
                                break
                            case AddonStatus.Disabled:
                                type = StatusType.pending
                                break
                            case AddonStatus.Unknown:
                            default:
                                type = StatusType.unknown
                        }
                        return <AcmInlineStatus type={type} status={item.status} />
                    },
                    search: 'status',
                },
                {
                    header: t('Messaged'),
                    cell: 'message',
                },
            ]}
            keyFn={(addon: Addon) => addon.name}
            tableActions={[]}
            rowActions={[]}
        />
    )
}
