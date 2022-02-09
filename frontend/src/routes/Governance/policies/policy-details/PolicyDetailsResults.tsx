/* Copyright Contributors to the Open Cluster Management project */
import { PageSection, Title } from '@patternfly/react-core'
import { AcmTable, AcmTablePaginationContextProvider } from '@stolostron/ui-components'
import { useMemo } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { Policy } from '../../../../resources'

// GRC-UI-API query:
// query getPolicyStatus($policyName: String!, $hubNamespace: String!) {
//     items: policyStatus(policyName: $policyName, hubNamespace: $hubNamespace) {
//       templateName
//       cluster
//       clusterNamespace
//       status
//       apiVersion
//       kind
//       message
//       timestamp
//       consoleURL
//       policyName
//       policyNamespace
//     }
//   }

export default function PolicyDetailsClusters(props: { policy: Policy }) {
    const { t } = useTranslation()
    const { policy } = props
    console.debug(policy)

    const columns = useMemo(
        () => [
            {
                header: 'Cluster',
                cell: '-',
            },
            {
                header: 'Compliance',
                cell: '-',
            },
            {
                header: 'Template',
                cell: '-',
            },
            {
                header: 'Message',
                cell: '-',
            },
            {
                header: 'Last report',
                cell: '-',
            },
            {
                header: 'History',
                cell: '-',
            },
        ],
        []
    )

    return (
        <PageSection>
            <Title className="title" headingLevel="h3">
                {t('Clusters')}
            </Title>
            <AcmTablePaginationContextProvider localStorageKey="grc-status-view">
                <AcmTable
                    // items={tableDataByClusters.rows} // items from PolicyStatus query: https://github.com/stolostron/grc-ui/blob/main/src-web/utils/client/queries.js#L275
                    items={[]}
                    columns={columns}
                    // keyFn={(item) => item.uid.toString()}
                    keyFn={() => Math.random().toString()}
                    // search={clusterQuery}
                    // setSearch={this.handleSearch}
                    initialSort={{
                        index: 1,
                        direction: 'desc',
                    }}
                    // searchPlaceholder={t('Find clusters')}
                    fuseThreshold={0}
                    plural={t('clusters')}
                />
            </AcmTablePaginationContextProvider>
        </PageSection>
    )
}
