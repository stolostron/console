/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@material-ui/styles'
import { ExpandableSection, ModalVariant, TextVariants, Text, Button, ButtonVariant } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { ClusterCurator, ClusterCuratorAnsibleJob } from '../resources'
import { AcmModal } from '../ui-components'
import { useTranslation } from '../lib/acm-i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../NavigationPath'
import { useState } from 'react'

export interface ITemplateSummaryModalProps {
    curatorTemplate: ClusterCurator
    isOpen: boolean
    close: () => void
}

/*
TODO: 
    clean up doc, 
    remove redundancy where possible,
    testing,
    style review,
    translation strings
*/
const useStyles = makeStyles({
    expandableSection: {
        paddingTop: '20px',
    },
    tableHeader: { padding: '0px 0px 8px 0px' },
    tableData: { padding: '8px 0px' },
})
// const classes = useStyles()

const getCircularReplacer = () => {
    const seen = new WeakSet()
    return (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return
            }
            seen.add(value)
        }
        return value
    }
}

export function TemplateSummaryExpandable(props: { clusterCurator?: ClusterCurator; control?: any }) {
    let { clusterCurator, control } = props
    const { t } = useTranslation()
    const [isInstallExpandableOpen, setInstallExpandable] = useState<boolean>(true)
    const [isUpgradeExpandableOpen, setUpgradeExpandable] = useState<boolean>(true)
    const classes = useStyles()
    const clusterCuratorTemplateName = control?.step.controls?.find((cc: any) => cc.id === 'templateName')
    // const CCSpec =
    // console.log('1', JSON.stringify(control, getCircularReplacer()))
    console.log('checking control active: ', clusterCuratorTemplateName)
    console.log('control: ', control)
    // if (control) {
    //     console.log('control preview: ', control)
    //     const clusterCuratorSpec = getControlByID(control.step.controls, 'clusterCuratorSpec')
    //     console.log('props: ', props)
    //     console.log('checking curator spec: ', clusterCuratorSpec)
    // }
    if (!clusterCurator) return <></>
    return (
        <div>
            {clusterCurator.spec?.install && (
                <ExpandableSection
                    onToggle={() => setInstallExpandable(!isInstallExpandableOpen)}
                    isExpanded={isInstallExpandableOpen}
                    toggleText="Install"
                    isIndented
                >
                    <ComposableTable
                        title={t('Pre-install Ansible job template')}
                        curatorJobs={
                            clusterCurator.spec.install.prehook?.map(
                                (job: ClusterCuratorAnsibleJob) => job.name
                            ) as string[]
                        }
                    ></ComposableTable>
                    <div className={classes.expandableSection}>
                        <ComposableTable
                            title={t('Post-install Ansible job template')}
                            curatorJobs={
                                clusterCurator.spec.install.posthook?.map(
                                    (job: ClusterCuratorAnsibleJob) => job.name
                                ) as string[]
                            }
                        ></ComposableTable>
                    </div>
                </ExpandableSection>
            )}
            {clusterCurator.spec?.upgrade && (
                <ExpandableSection
                    onToggle={() => setUpgradeExpandable(!isUpgradeExpandableOpen)}
                    isExpanded={isUpgradeExpandableOpen}
                    className={classes.expandableSection}
                    toggleText="Upgrade"
                    isIndented
                >
                    <ComposableTable
                        title={t('Pre-upgrade Ansible job template')}
                        curatorJobs={
                            clusterCurator.spec.upgrade.prehook?.map(
                                (job: ClusterCuratorAnsibleJob) => job.name
                            ) as string[]
                        }
                    ></ComposableTable>
                    <div className={classes.expandableSection}>
                        <ComposableTable
                            title={t('Post-upgrade Ansible job template')}
                            curatorJobs={
                                clusterCurator.spec.upgrade.posthook?.map(
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

export default function TemplateSummaryModal(props: ITemplateSummaryModalProps) {
    const { curatorTemplate, isOpen, close } = props
    const { t } = useTranslation()
    return (
        <AcmModal
            title={t('Automation template for {{curatorName}}', { curatorName: curatorTemplate.metadata.name })}
            variant={ModalVariant.medium}
            isOpen={isOpen}
            onClose={close}
        >
            <TemplateSummaryExpandable clusterCurator={curatorTemplate}></TemplateSummaryExpandable>
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
                    {curatorJobs.length > 0 ? (
                        curatorJobs.map((item) => (
                            <Tr key={item}>
                                <Td style={{ padding: '8px 0px' }} dataLabel={item}>
                                    {item}
                                </Td>
                            </Tr>
                        ))
                    ) : (
                        <Text component={TextVariants.small}>none selected</Text>
                    )}
                </Tbody>
            )}
        </TableComposable>
    )
}

export function templateLinkOut(props: { curator: ClusterCurator }) {
    const { curator } = props
    const { t } = useTranslation()
    const history = useHistory()
    return (
        <div>
            <Button
                isInline
                variant={ButtonVariant.link}
                onClick={() =>
                    history.push(
                        NavigationPath.editAnsibleAutomation
                            .replace(':namespace', curator.metadata?.namespace as string)
                            .replace(':name', curator.metadata?.name as string)
                    )
                }
            >
                {t('View {{curatorName}}', { curatorName: curator.metadata.name })}
                <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </Button>
        </div>
    )
}
