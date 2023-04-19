/* Copyright Contributors to the Open Cluster Management project */
import {
  ClusterCurator,
  ClusterStatus,
  getMostRecentAnsibleJobPod,
  getLatestAnsibleJob,
  AnsibleJob,
} from '../../../../../resources'
import { AcmProgressTracker, getStatusLabel, ProgressTrackerStep, StatusType } from '../../../../../ui-components'
import { Card, CardBody } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { launchLogs } from './HiveNotification'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { launchToOCP } from '../../../../../lib/ocp-utils'
import { getFailedCuratorJobName } from '../../../../../resources/utils/status-conditions'

export function ProgressStepBar() {
  const { t } = useTranslation()
  const { cluster, clusterDeployment } = useContext(ClusterContext)
  const { ansibleJobState, clusterCuratorsState, configMapsState } = useSharedAtoms()
  const [curators] = useRecoilState(clusterCuratorsState)
  const [ansibleJobs] = useRecoilState(ansibleJobState)
  const [configMaps] = useRecoilState(configMapsState)
  const latestJobs = getLatestAnsibleJob(ansibleJobs, cluster?.name!)
  const curator = curators.find(
    (curator) => curator.metadata.name === cluster?.name && curator.metadata.namespace == cluster?.namespace
  )

  const installStatus = [
    ClusterStatus.prehookjob,
    ClusterStatus.prehookfailed,
    ClusterStatus.creating,
    ClusterStatus.provisionfailed,
    ClusterStatus.posthookjob,
    ClusterStatus.posthookfailed,
  ]

  if (
    installStatus.includes(cluster?.status!) ||
    (clusterDeployment && // Creation flow only valid when there is a ClusterDeployment
      clusterDeployment?.status?.powerState !== 'Running' && // if ClusterDeployment is already running, this is a re-import
      [ClusterStatus.importing, ClusterStatus.importfailed].includes(cluster?.status!))
  ) {
    // hook state
    const prehooks = curator?.spec?.install?.prehook?.length
    const posthooks = curator?.spec?.install?.posthook?.length
    let creatingStatus = StatusType.pending
    let prehookStatus = StatusType.pending
    let posthookStatus: StatusType | undefined = undefined
    let importStatus = StatusType.pending

    switch (cluster?.status) {
      case ClusterStatus.posthookjob:
        posthookStatus = StatusType.progress
        break
      case ClusterStatus.posthookfailed:
        posthookStatus = StatusType.danger
        break
      default: {
        if (posthooks) {
          posthookStatus = StatusType.empty
        } else {
          posthookStatus = StatusType.pending
        }
      }
    }

    switch (cluster?.status) {
      case ClusterStatus.importing:
        importStatus = StatusType.progress
        break
      case ClusterStatus.importfailed:
        importStatus = StatusType.danger
        break
      default: {
        if (posthookStatus === StatusType.progress || posthookStatus === StatusType.danger) {
          importStatus = StatusType.healthy
        } else {
          importStatus = StatusType.empty
        }
      }
    }

    // creating
    switch (cluster?.status) {
      case ClusterStatus.creating:
        creatingStatus = StatusType.progress
        break
      case ClusterStatus.provisionfailed:
        creatingStatus = StatusType.danger
        break
      default: {
        if (importStatus !== StatusType.empty) {
          creatingStatus = StatusType.healthy
        } else {
          creatingStatus = StatusType.empty
        }
      }
    }

    // prehook
    switch (cluster?.status) {
      case ClusterStatus.prehookjob:
        prehookStatus = StatusType.progress
        break
      case ClusterStatus.prehookfailed:
        prehookStatus = StatusType.danger
        break
      default:
        prehookStatus = StatusType.healthy
    }

    const provisionStatus: string[] = [
      ClusterStatus.creating,
      ClusterStatus.provisionfailed,
      ClusterStatus.importing,
      ClusterStatus.importfailed,
      ClusterStatus.posthookjob,
      ClusterStatus.posthookfailed,
    ]
    const steps: ProgressTrackerStep[] = [
      {
        statusType: prehookStatus,
        statusText: t('status.prehook'),
        statusSubtitle: prehooks ? getStatusLabel(prehookStatus, t) : t('status.subtitle.nojobs'),
        stepID: 'prehook',
        // will render link when prehook job url is defined or when there are no job hooks setup
        ...((!!prehooks || (!prehooks && !posthooks)) && {
          link: {
            linkName: !prehooks && !posthooks ? t('status.link.info') : t('status.link.logs'),
            // TODO: add ansible documentation url
            linkUrl:
              !prehooks && !posthooks ? DOC_LINKS.ANSIBLE_JOBS : latestJobs.prehook?.status?.ansibleJobResult?.url,
            isDisabled: isPrehookLinkDisabled(prehooks, posthooks, latestJobs, curator),
            linkCallback: !latestJobs.prehook?.status?.ansibleJobResult?.url
              ? () => {
                  curator && launchJobLogs(curator)
                }
              : undefined,
          },
        }),
      },
      {
        statusType: creatingStatus,
        statusText: t('status.install.text'),
        statusSubtitle: getStatusLabel(creatingStatus, t),
        stepID: 'install',
        ...(provisionStatus.includes(cluster?.status!) && {
          link: {
            linkName: t('status.link.logs'),
            linkCallback: () => {
              if (cluster?.isHypershift) {
                const url = `k8s/ns/${cluster.hypershift?.hostingNamespace}-${cluster.name}/pods`
                launchToOCP(url)
              } else {
                launchLogs(cluster!, configMaps)
              }
            },
          },
        }),
      },
      {
        statusType: importStatus,
        stepID: 'import',
        statusText: t('status.import.text'),
        statusSubtitle: getStatusLabel(importStatus, t),
      },
      {
        statusType: posthookStatus,
        stepID: 'posthook',
        statusText: t('status.posthook'),
        statusSubtitle: posthooks ? getStatusLabel(posthookStatus, t) : t('status.subtitle.nojobs'),
        ...(posthooks &&
          (cluster?.status === 'posthookjob' ||
            cluster?.status === 'posthookfailed' ||
            latestJobs.posthook?.status?.ansibleJobResult?.url) && {
            link: {
              linkName: t('status.link.logs'),
              linkUrl: latestJobs.posthook?.status?.ansibleJobResult?.url,
              isDisabled: isPosthookLinkDisabled(latestJobs, curator),
              linkCallback: !latestJobs.posthook?.status?.ansibleJobResult?.url
                ? () => {
                    curator && launchJobLogs(curator)
                  }
                : undefined,
            },
          }),
      },
    ]

    let completedSteps = 0
    steps.forEach((step, index) => {
      if (step.statusType === StatusType.progress) completedSteps = index
    })

    return (
      <div style={{ marginBottom: '24px' }}>
        <Card>
          <CardBody>
            <AcmProgressTracker
              Title={t('status.stepbar.title')}
              Subtitle={t('status.stepbar.subtitle', { stepsDone: completedSteps, steps: steps.length })}
              isStacked={false}
              steps={steps}
              isCentered={true}
            ></AcmProgressTracker>
          </CardBody>
        </Card>
      </div>
    )
  }
  return null
}

export function launchJobLogs(curator: ClusterCurator | undefined) {
  if (curator?.status?.conditions) {
    const jobName = getFailedCuratorJobName(curator.metadata.name!, curator.status.conditions)
    const jobPodResponse = getMostRecentAnsibleJobPod(curator?.metadata.namespace!, jobName!)
    jobPodResponse.then((pod) => {
      launchToOCP(`k8s/ns/${curator.metadata.name}/pods/${pod?.metadata.name}/logs`)
    })
  }
}

export function jobPodsStillAvailable(curator: ClusterCurator | undefined) {
  const failurePodTransitionTime = curator?.status?.conditions?.find(
    (c) => c.type === 'clustercurator-job'
  )?.lastTransitionTime

  if (!failurePodTransitionTime) {
    return false
  }
  const podCompletionTime = new Date(failurePodTransitionTime)
  const currentTime = new Date()
  const hoursSincePodFailure = Math.floor((currentTime.getTime() - podCompletionTime.getTime()) / 1000 / 60 / 60)
  return hoursSincePodFailure < 1
}
export const isPrehookLinkDisabled = (
  prehooks: number | undefined,
  posthooks: number | undefined,
  latestJobs: {
    prehook: AnsibleJob | undefined
    posthook: AnsibleJob | undefined
  },
  curator: ClusterCurator | undefined
) => {
  // if no jobs are defined we surface a link to the automation docs
  if (!prehooks && !posthooks) {
    return false
  }
  if (!prehooks && !!posthooks) {
    return true
  }
  // if there are prehooks, an undefined url, an error in latest job status, and the pods are avaiable,
  // enable link to pods
  if (!!prehooks && latestJobs.prehook?.status?.ansibleJobResult?.url === undefined) {
    if (latestJobs.prehook?.status?.ansibleJobResult?.status === 'error' && jobPodsStillAvailable(curator)) {
      return false
    }
    return true
  }
  return false
}

export const isPosthookLinkDisabled = (
  latestJobs: {
    prehook: AnsibleJob | undefined
    posthook: AnsibleJob | undefined
  },
  curator: ClusterCurator | undefined
) => {
  if (
    latestJobs.posthook?.status?.ansibleJobResult?.url ||
    (latestJobs.posthook?.status?.ansibleJobResult?.status === 'error' && jobPodsStillAvailable(curator))
  ) {
    return false
  }
  return true
}
