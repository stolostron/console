/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus, getLatestAnsibleJob } from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '@stolostron/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { ansibleJobState, configMapsState } from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterStatusMessageAlert } from './ClusterStatusMessageAlert'
import { launchLogs, launchToYaml } from './HiveNotification'

export function StatusField(props: { cluster: Cluster }) {
    const { t } = useTranslation()
    const [configMaps] = useRecoilState(configMapsState)
    const [ansibleJobs] = useRecoilState(ansibleJobState)
    const latestJob = getLatestAnsibleJob(ansibleJobs, props.cluster?.name!)

    let type: StatusType

    switch (props.cluster?.status) {
        case ClusterStatus.ready:
            type = StatusType.healthy
            break
        case ClusterStatus.running:
            type = StatusType.running
            break
        case ClusterStatus.needsapproval:
            type = StatusType.warning
            break
        case ClusterStatus.failed:
        case ClusterStatus.notstarted:
        case ClusterStatus.provisionfailed:
        case ClusterStatus.deprovisionfailed:
        case ClusterStatus.notaccepted:
        case ClusterStatus.offline:
        case ClusterStatus.degraded:
        case ClusterStatus.prehookfailed:
        case ClusterStatus.posthookfailed:
        case ClusterStatus.importfailed:
            type = StatusType.danger
            break
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.detaching:
        case ClusterStatus.stopping:
        case ClusterStatus.resuming:
        case ClusterStatus.prehookjob:
        case ClusterStatus.posthookjob:
        case ClusterStatus.importing:
            type = StatusType.progress
            break
        case ClusterStatus.detached:
            type = StatusType.detached
            break
        case ClusterStatus.hibernating:
            type = StatusType.sleep
            break
        case ClusterStatus.unknown:
            type = StatusType.unknown
            break
        case ClusterStatus.draft:
            type = StatusType.draft
            break
        case ClusterStatus.pending:
        case ClusterStatus.pendingimport:
        default:
            type = StatusType.pending
    }

    let hasAction = false
    let Action = () => <></>
    switch (props.cluster?.status) {
        case ClusterStatus.notstarted:
            hasAction = true
            Action = () => (
                <AcmButton
                    style={{ padding: 0, fontSize: 'inherit' }}
                    key={props.cluster.name}
                    onClick={() => launchToYaml(props.cluster, configMaps)}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                >
                    {t('view.yaml')}
                </AcmButton>
            )
            break
        case ClusterStatus.prehookjob:
        case ClusterStatus.prehookfailed:
            hasAction = true
            Action = () => (
                <AcmButton
                    style={{ padding: 0, fontSize: 'inherit' }}
                    key={props.cluster.name}
                    onClick={() => window.open(latestJob.prehook?.status?.ansibleJobResult.url)}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                    isDisabled={!latestJob.prehook?.status?.ansibleJobResult?.url}
                >
                    {t('view.logs')}
                </AcmButton>
            )
            break
        case ClusterStatus.posthookjob:
        case ClusterStatus.posthookfailed:
            hasAction = true
            Action = () => (
                <AcmButton
                    style={{ padding: 0, fontSize: 'inherit' }}
                    key={props.cluster.name}
                    onClick={() => window.open(latestJob.posthook?.status?.ansibleJobResult.url)}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                    isDisabled={!latestJob.posthook?.status?.ansibleJobResult?.url}
                >
                    {t('view.logs')}
                </AcmButton>
            )
            break
        case ClusterStatus.creating:
        case ClusterStatus.destroying:
        case ClusterStatus.provisionfailed:
            hasAction = true
            Action = () => (
                <AcmButton
                    style={{ padding: 0, fontSize: 'inherit' }}
                    key={props.cluster.name}
                    onClick={() => launchLogs(props.cluster, configMaps)}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                >
                    {t('view.logs')}
                </AcmButton>
            )
            break
        case ClusterStatus.degraded:
            hasAction = true
            Action = () => (
                <Link to={`${NavigationPath.clusterSettings.replace(':id', props.cluster?.name!)}`}>
                    {t('view.addons')}
                </Link>
            )
            break
        case ClusterStatus.draft:
            hasAction = true
            Action = () => (
                <Link
                    to={`${NavigationPath.editCluster
                        .replace(':namespace', props.cluster?.namespace!)
                        .replace(':name', props.cluster?.name!)}`}
                >
                    {t('cluster.edit')}
                </Link>
            )
            break
    }

    return (
        <AcmInlineStatus
            type={type}
            status={t(`status.${props.cluster?.status}`)}
            popover={{
                maxWidth: '448px',
                bodyContent: (
                    <>
                        <Trans i18nKey={`status.${props.cluster?.status}.message`} components={{ bold: <strong /> }} />
                        <ClusterStatusMessageAlert cluster={props.cluster!} padTop />
                    </>
                ),
                footerContent: hasAction && <Action />,
                showClose: false,
            }}
        />
    )
}
