/* Copyright Contributors to the Open Cluster Management project */
import {
    Alert,
    AlertVariant,
    Button,
    ButtonVariant,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Stack,
    Text,
} from '@patternfly/react-core'
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    ExternalLinkAltIcon,
} from '@patternfly/react-icons'
import { AcmTable } from '@stolostron/ui-components'
import moment from 'moment'
import { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { ansibleJobState, configMapsState, secretsState, subscriptionOperatorsState } from '../../../atoms'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleJob, deleteResource, Policy, PolicyAutomation, Secret, SubscriptionOperator } from '../../../resources'
import { ClusterPolicyViolationIcons } from '../components/ClusterPolicyViolations'
import { useGovernanceData } from '../useGovernanceData'

export interface JobTableData {
    name: string
    namespace: string
    status: string
    started: string
    finished: string
}

export function AutomationDetailsSidebar(props: {
    setModal: (modal: React.ReactNode) => void
    policyAutomationMatch: PolicyAutomation
    policy: Policy
    onClose: () => void
}) {
    const { policyAutomationMatch, policy, onClose } = props
    const { t } = useTranslation()
    const history = useHistory()
    const [ansibleJobs] = useRecoilState(ansibleJobState)
    const [configMaps] = useRecoilState(configMapsState)
    const [subscriptionOperators] = useRecoilState(subscriptionOperatorsState)
    const [secrets] = useRecoilState(secretsState)
    const govData = useGovernanceData([policy])
    const clusterRiskScore =
        govData.clusterRisks.high +
        govData.clusterRisks.medium +
        govData.clusterRisks.low +
        govData.clusterRisks.unknown +
        govData.clusterRisks.synced

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<PolicyAutomation> | { open: false }>({
        open: false,
    })

    const isOperatorInstalled = useMemo(() => {
        const ansibleOp = subscriptionOperators.filter((op: SubscriptionOperator) => {
            const conditions = op.status?.conditions[0]
            return (
                op.metadata.name === 'ansible-automation-platform-operator' &&
                conditions?.reason === 'AllCatalogSourcesHealthy'
            )
        })
        return ansibleOp.length > 0
    }, [subscriptionOperators])

    const credential = useMemo(
        () =>
            secrets.filter(
                (secret: Secret) =>
                    secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                    secret.metadata.name === policyAutomationMatch.spec.automationDef.secret
            ),
        [policyAutomationMatch, secrets]
    )

    const towerURL = useMemo(
        () => (credential[0] ? Buffer.from(credential[0]?.data!.host, 'base64').toString('ascii') : '-'),
        [credential]
    )

    const jobItems = useMemo(
        () =>
            ansibleJobs
                .filter((job: AnsibleJob) => {
                    const {
                        metadata: { ownerReferences },
                    } = job
                    if (!ownerReferences) {
                        return false
                    }
                    const matched = ownerReferences.find(
                        (or) =>
                            or.apiVersion === 'policy.open-cluster-management.io/v1beta1' &&
                            or.kind === 'PolicyAutomation' &&
                            or.name === policyAutomationMatch.metadata.name
                    )
                    return matched !== undefined
                })
                .map((job: AnsibleJob) => {
                    const jobResult = job.status?.ansibleJobResult
                    const conditions = job.status?.conditions
                    const ansibleResultCondition = conditions?.find((arc) => arc.ansibleResult)
                    return {
                        name: job.metadata.name!,
                        namespace: job.metadata.namespace!,
                        status: jobResult?.status ?? 'No status',
                        started: jobResult?.started
                            ? moment(new Date(jobResult?.started)).fromNow()
                            : moment(new Date(ansibleResultCondition?.lastTransitionTime ?? '')).fromNow(),
                        finished: jobResult?.finished
                            ? moment(new Date(jobResult?.finished)).fromNow()
                            : moment(new Date(ansibleResultCondition?.lastTransitionTime ?? '')).fromNow(),
                    }
                }),
        [ansibleJobs, policyAutomationMatch.metadata.name]
    )

    const jobCols = useMemo(
        () => [
            {
                header: 'Status',
                cell: (item: JobTableData) => {
                    let ansibleJobStatus = item.status
                    ansibleJobStatus =
                        ansibleJobStatus && typeof ansibleJobStatus === 'string'
                            ? ansibleJobStatus.trim().toLowerCase()
                            : '-'
                    switch (ansibleJobStatus) {
                        case 'successful':
                            return (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {'Successful'}
                                </div>
                            )
                        case 'error':
                        case 'failed':
                            return (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {'Failed'}
                                </div>
                            )
                        case '-':
                            return (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )
                        default:
                            return (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )
                    }
                },
                sort: 'status',
            },
            {
                header: 'Started',
                cell: 'started',
                sort: 'started',
            },
            {
                header: 'Finished',
                cell: 'finished',
                sort: 'finished',
            },
            {
                header: '',
                cell: (item: JobTableData) => (
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${NavigationPath.search}?filters={%22textsearch%22:%22cluster%3Alocal-cluster%20kind%3Aansiblejob%20namespace%3A${item.namespace}%20name%3A${item.name}%22}`}
                    >
                        {'View job'}
                    </a>
                ),
            },
        ],
        []
    )

    function getOperatorError() {
        const openShiftConsoleConfig = configMaps.find((configmap) => configmap.metadata.name === 'console-public')
        const openShiftConsoleUrl = openShiftConsoleConfig?.data?.consoleURL
        return (
            <div>
                {t(
                    'The Ansible Automation Platform Resource Operator is required to create an Ansible job. Install the operator through the following link: '
                )}
                <Button
                    isInline
                    variant={ButtonVariant.link}
                    onClick={() =>
                        window.open(
                            openShiftConsoleUrl + '/operatorhub/all-namespaces?keyword=ansible+automation+platform'
                        )
                    }
                >
                    {t('Operator')}
                    <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                </Button>
            </div>
        )
    }

    return (
        <div>
            <BulkActionModel<PolicyAutomation> {...modalProps} />
            {!isOperatorInstalled && <Alert isInline title={getOperatorError()} variant={AlertVariant.danger} />}
            <Stack hasGutter>
                <DescriptionList>
                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Policy name')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>{policyAutomationMatch.spec.policyRef}</DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Cluster violations')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                            {clusterRiskScore > 0 ? (
                                <ClusterPolicyViolationIcons risks={govData.clusterRisks} />
                            ) : (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )}
                        </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Ansible tower URL')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                            <Button isInline variant={ButtonVariant.link} href={towerURL}>
                                {towerURL}
                            </Button>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </Stack>
            <AcmTable<JobTableData>
                key="ansible-job-history"
                plural={'ansible jobs'}
                items={jobItems}
                columns={jobCols}
                keyFn={(item) => item.name}
                autoHidePagination={true}
                initialSort={{
                    index: 1,
                    direction: 'desc',
                }}
            />
            <div style={{ display: 'flex', position: 'fixed', bottom: 0, padding: '1rem 0' }}>
                <Button
                    variant="primary"
                    onClick={() =>
                        history.push(
                            NavigationPath.editPolicyAutomation
                                .replace(':namespace', policy.metadata.namespace as string)
                                .replace(':name', policy.metadata.name as string)
                        )
                    }
                >
                    {'Edit'}
                </Button>
                {/* 16px is standard pf button spacing */}
                <div style={{ width: '16px' }} />
                <Button variant="secondary" onClick={onClose}>
                    {'Cancel'}
                </Button>
                {/* 16px is standard pf button spacing */}
                <div style={{ width: '16px' }} />
                <Button
                    variant="danger"
                    onClick={() =>
                        setModalProps({
                            icon: 'danger',
                            open: true,
                            title: t('Permanently delete policy automation?'),
                            action: t('Delete'),
                            processing: t('Deleting'),
                            resources: [policyAutomationMatch],
                            description: (
                                <Text>
                                    <Trans
                                        i18nKey="Deleting <italic>{{policyAutomation}}</italic> is irreversible. Any associated Ansible job will be deleted."
                                        values={{ policyAutomation: policyAutomationMatch.metadata.name! }}
                                        components={{ italic: <em /> }}
                                    />
                                </Text>
                            ),
                            keyFn: (policyAutomationMatch: PolicyAutomation) =>
                                policyAutomationMatch.metadata.uid as string,
                            actionFn: (policyAutomationMatch) => {
                                const jobMatches = ansibleJobs.filter(
                                    (job) =>
                                        job.metadata.name === policyAutomationMatch.spec.automationDef.name &&
                                        job.metadata.namespace === policyAutomationMatch.metadata.namespace
                                )
                                for (const job of jobMatches) {
                                    deleteResource(job)
                                }
                                return deleteResource(policyAutomationMatch)
                            },
                            close: () => {
                                setModalProps({ open: false })
                                onClose()
                            },
                            onCancel: () => {
                                setModalProps({ open: false })
                            },
                        })
                    }
                >
                    {'Delete'}
                </Button>
            </div>
        </div>
    )
}
