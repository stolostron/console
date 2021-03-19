/* Copyright Contributors to the Open Cluster Management project */

import { AcmInlineStatus, AcmPageContent, AcmTable, StatusType } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Addon, AddonStatus } from '../../../../../lib/get-addons'
import { ClusterContext } from '../ClusterDetails'

export function ClustersSettingsPageContent() {
    const { addons } = useContext(ClusterContext)
    return (
        <AcmPageContent id="addons">
            <PageSection variant="light" isFilled>
                <ClusterSettingsTable addons={addons} />
            </PageSection>
        </AcmPageContent>
    )
}

export function ClusterSettingsTable(props: { addons: Addon[] | undefined }) {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmTable<Addon>
            plural="add-ons"
            items={props.addons}
            columns={[
                {
                    header: t('table.name'),
                    sort: 'name',
                    search: 'name',
                    cell: 'name',
                },
                {
                    header: t('table.status'),
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
                    header: t('table.message'),
                    cell: 'message',
                },
            ]}
            keyFn={(addon: Addon) => addon.name}
            tableActions={[]}
            bulkActions={[]}
            rowActions={[]}
        />
    )
}
