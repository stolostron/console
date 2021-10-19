/* Copyright Contributors to the Open Cluster Management project */

import { AcmTable, IAcmTableColumn } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { applicationsState } from '../../atoms'
import { IResource } from '../../resources'

export default function ApplicationsOverview() {
    const { t } = useTranslation(['govenance'])

    const [applications] = useRecoilState(applicationsState)

    const keyFn = useCallback(
        (resource: IResource) => resource.metadata!.uid ?? `${resource.metadata!.name}/${resource.metadata!.namespace}`,
        []
    )
    const columns = useMemo<IAcmTableColumn<IResource>[]>(
        () => [
            {
                header: t('Name'),
                cell: 'metadata.name',
                sort: 'metadata.name',
                search: 'metadata.name',
            },
            {
                header: t('Namespace'),
                cell: 'metadata.namespace',
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
            },
        ],
        []
    )

    return (
        <PageSection>
            <AcmTable<IResource> plural={t('Applications')} columns={columns} keyFn={keyFn} items={applications} />
        </PageSection>
    )
}
