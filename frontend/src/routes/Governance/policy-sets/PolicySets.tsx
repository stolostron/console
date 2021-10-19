/* Copyright Contributors to the Open Cluster Management project */

import { AcmTable, IAcmRowAction, IAcmTableBulkAction, IAcmTableColumn } from '@open-cluster-management/ui-components'
import { ButtonVariant, Chip, PageSection } from '@patternfly/react-core'
import { Fragment, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { placementBindingsState } from '../../../atoms'
import { PlacementBinding } from '../../../resources/placement-binding'

export default function PolicySetsPage() {
    const { t } = useTranslation(['govenance'])

    const [placementBindings] = useRecoilState(placementBindingsState)

    const placementBindingeKeyFn = useCallback(
        (placementRule: PlacementBinding) => `${placementRule.metadata.namespace}/${placementRule.metadata.name}`,
        []
    )

    const placementBindingColumns = useMemo<IAcmTableColumn<PlacementBinding>[]>(
        () => [
            {
                header: t('Name'),
                cell: (placementBinding) => <a>{placementBinding.metadata.name}</a>,
                sort: 'metadata.name',
                search: 'metadata.name',
            },
            {
                header: t('Namespace'),
                cell: 'metadata.namespace',
            },
            {
                header: t('Policies'),
                cell: (t) => (
                    <Fragment>
                        {t.subjects?.map((subject) => (
                            <Chip isReadOnly style={{ maxWidth: '9999' }}>
                                {subject.name}
                            </Chip>
                        ))}
                    </Fragment>
                ),
            },
        ],
        []
    )

    const tableActions = useMemo<IAcmTableBulkAction<PlacementBinding>[]>(
        () => [
            {
                variant: 'bulk-action',
                id: 'delete-policy',
                title: t('Delete'),
                click: () => {},
            },
        ],
        []
    )

    const rowActions = useMemo<IAcmRowAction<PlacementBinding>[]>(
        () => [
            {
                id: 'delete-policy',
                title: t('Delete'),
                click: () => {},
            },
        ],
        []
    )

    return (
        <PageSection>
            <AcmTable<PlacementBinding>
                plural={t('Policy sets')}
                columns={placementBindingColumns}
                keyFn={placementBindingeKeyFn}
                items={placementBindings}
                rowActions={rowActions}
                tableActions={tableActions}
                tableActionButtons={[
                    {
                        variant: ButtonVariant.primary,
                        id: 'create',
                        title: 'Create policy set',
                        click: () => {},
                    },
                ]}
            />
        </PageSection>
    )
}
