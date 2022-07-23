/* Copyright Contributors to the Open Cluster Management project */
import { ExpandableSection, ModalVariant } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { ClusterCurator, ClusterCuratorAnsibleJob, ClusterCuratorApiVersion, ClusterCuratorKind } from '../resources'
import { AcmModal } from '../ui-components'

export interface ITemplateSummaryModalProps {
    curatorTemplate?: ClusterCurator
}

/*
TODO: 
    clean up doc, 
    remove redundancy where possible,
    testing
    style review
*/

function TemplateSummaryExpandable(props: { clusterCurator: ClusterCurator }) {
    const curator = props.clusterCurator
    return (
        <div>
            {curator.spec?.install && (
                <ExpandableSection toggleText="Install" isIndented>
                    <ComposableTable
                        title="Pre-install Ansible job template"
                        curatorJobs={
                            curator.spec.install.prehook?.map((job: ClusterCuratorAnsibleJob) => job.name) as string[]
                        }
                    ></ComposableTable>
                    <div style={{ paddingTop: '20px' }}>
                        <ComposableTable
                            title="Post-install Ansible job template"
                            curatorJobs={
                                curator.spec.install.posthook?.map(
                                    (job: ClusterCuratorAnsibleJob) => job.name
                                ) as string[]
                            }
                        ></ComposableTable>
                    </div>
                </ExpandableSection>
            )}
            {curator.spec?.upgrade && (
                <ExpandableSection style={{ paddingTop: '20px' }} toggleText="Upgrade" isIndented>
                    <ComposableTable
                        title="Pre-upgrade Ansible job template"
                        curatorJobs={
                            curator.spec.upgrade.prehook?.map((job: ClusterCuratorAnsibleJob) => job.name) as string[]
                        }
                    ></ComposableTable>
                    <div style={{ paddingTop: '20px' }}>
                        <ComposableTable
                            title="Post-upgrade Ansible job template"
                            curatorJobs={
                                curator.spec.upgrade.posthook?.map(
                                    (job: ClusterCuratorAnsibleJob) => job.name
                                ) as string[]
                            }
                        ></ComposableTable>
                    </div>
                </ExpandableSection>
            )}
            {/* {curator.spec?.scale && <ExpandableSection></ExpandableSection>}
            {curator.spec?.destroy && <ExpandableSection></ExpandableSection>} */}
        </div>
    )
}

export default function TemplateSummaryModalProps(props: ITemplateSummaryModalProps) {
    return (
        <AcmModal variant={ModalVariant.medium} isOpen={true}>
            <TemplateSummaryExpandable clusterCurator={testTemplate}></TemplateSummaryExpandable>
        </AcmModal>
    )
}

function ComposableTable(props: { title: string; curatorJobs?: string[] }) {
    const { curatorJobs, title } = props

    return (
        <TableComposable aria-label="Simple table" variant={'compact'}>
            {/* <Caption>Simple table using composable components</Caption> */}
            <Thead>
                <Tr>
                    <Th style={{ padding: '0px 0px 8px 0px' }}>{title}</Th>
                </Tr>
            </Thead>
            {curatorJobs && (
                <Tbody>
                    {curatorJobs.length > 0 &&
                        curatorJobs.map((item) => (
                            <Tr key={item}>
                                <Td style={{ padding: '8px 0px' }} dataLabel={item}>
                                    {item}
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            )}
        </TableComposable>
    )
}

const testTemplate: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator',
        namespace: 'default',
    },
    spec: {
        desiredCuration: 'install',
        install: {
            towerAuthSecret: '123',
            prehook: [{ name: 'prehook-1' }, { name: 'prehook-2' }],
            posthook: [{ name: 'posthook-1' }, { name: 'posthook-2' }],
        },
        upgrade: {
            desiredUpdate: '',
            channel: '',
            upstream: '',
            towerAuthSecret: '123',
            prehook: [{ name: 'prehook-1' }, { name: 'prehook-2' }],
            posthook: [{ name: 'posthook-1' }, { name: 'posthook-2' }],
        },
    },
}
