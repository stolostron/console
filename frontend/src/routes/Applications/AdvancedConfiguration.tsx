/* Copyright Contributors to the Open Cluster Management project */

import { AcmExpandableCard, AcmTable, IAcmTableColumn } from '@open-cluster-management/ui-components'
import {
    Card,
    CardTitle,
    CardBody,
    PageSection,
    Split,
    Stack,
    StackItem,
    TextContent,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../../lib/doc-util'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { applicationsState } from '../../atoms'
import { IResource } from '../../resources'

export default function AdvancedConfiguration() {
    const { t } = useTranslation(['application'])

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

    function TerminologyCard(props: { title: string; description: string }) {
        return (
            <Card isPlain isCompact>
                <CardTitle
                    style={{
                        color: '#5a6872',
                        fontSize: '16px',
                        lineHeight: '18px',
                        fontWeight: 600,
                        marginBottom: '10px',
                    }}
                >
                    {props.title}
                </CardTitle>
                <CardBody style={{ color: '#5a6872', fontSize: '12px', lineHeight: '20px' }}>
                    {props.description}
                </CardBody>
            </Card>
        )
    }

    return (
        <PageSection>
            <Stack hasGutter>
                <StackItem>
                    <AcmExpandableCard title={t('application:description.title.deploymentHighlightsTerminology')}>
                        <Split hasGutter>
                            <TerminologyCard
                                title={t('application:description.title.deploymentHighlightsTerminology.subscriptions')}
                                description={t(
                                    'application:description.title.deploymentHighlightsTerminology.subscriptionsSummary'
                                )}
                            />
                            <TerminologyCard
                                title={t(
                                    'application:description.title.deploymentHighlightsTerminology.placementRules'
                                )}
                                description={t(
                                    'application:description.title.deploymentHighlightsTerminology.placementRulesSummary'
                                )}
                            />
                            <TerminologyCard
                                title={t('application:description.title.deploymentHighlightsTerminology.channels')}
                                description={t(
                                    'application:description.title.deploymentHighlightsTerminology.channelsSummary'
                                )}
                            />
                        </Split>
                        <TextContent>
                            <Text
                                component={TextVariants.p}
                                style={{
                                    textAlign: 'right',
                                    display: 'inline-block',
                                    width: '100%',
                                    padding: '1.5rem 1rem 0',
                                }}
                            >
                                <Text
                                    component={TextVariants.a}
                                    isVisitedLink
                                    href={DOC_LINKS.MANAGE_APPLICATIONS}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        padding: '0px 10px',
                                        fontSize: '14px',
                                        color: '#0066cc',
                                    }}
                                >
                                    {t('application:description.title.deploymentHighlightsTerminology.docsLink')}{' '}
                                    <ExternalLinkAltIcon />
                                </Text>
                            </Text>
                        </TextContent>
                    </AcmExpandableCard>
                </StackItem>
                <StackItem>
                    <AcmTable<IResource>
                        plural={t('Applications')}
                        columns={columns}
                        keyFn={keyFn}
                        items={applications}
                    />
                </StackItem>
            </Stack>
        </PageSection>
    )
}
