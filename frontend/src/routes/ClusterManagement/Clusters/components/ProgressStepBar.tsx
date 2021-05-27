/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody } from '@patternfly/react-core'
import { AcmProgressTracker, ProgressTrackerStep, StatusType } from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { clusterCuratorsState } from '../../../../atoms'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

const [curators] = useRecoilState(clusterCuratorsState)

export function ProgressStepBar(props: { cluster: Cluster | undefined }) {
    const { t } = useTranslation()
    const { cluster } = props
    const curator = curators.find((curator) => curator.metadata.name === cluster?.name)
    const [stepsCompleted, setStepsCompleted] = useState(0)

    const installStatus = [
        ClusterStatus.prehookjob,
        ClusterStatus.prehookfailed,
        ClusterStatus.creating,
        ClusterStatus.provisionfailed,
        ClusterStatus.pendingimport,
        ClusterStatus.importfailed,
        ClusterStatus.posthookjob,
        ClusterStatus.posthookfailed,
    ]

    if (installStatus.includes(cluster?.status!)) {
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
                if (prehooks) {
                    prehookStatus = StatusType.healthy
                } else {
                    prehookStatus = StatusType.pending
                }
        }

        const steps: ProgressTrackerStep[] = [
            {
                statusType: prehookStatus,
                statusText: t('status.prehook.text'),
                statusSubtitle: t(`status.subtitle.${prehookStatus}`),
            },
            {
                statusType: creatingStatus,
                statusText: t('status.install.text'),
                statusSubtitle: t(`status.subtitle.${creatingStatus}`),
            },
            {
                statusType: importStatus,
                statusText: t('status.import.text'),
                statusSubtitle: t(`status.subtitle.${importStatus}`),
            },
            {
                statusType: posthookStatus,
                statusText: t('status.posthook.text'),
                statusSubtitle: t(`status.subtitle.${posthookStatus}`),
            },
        ]

        useEffect(() => {
            let completedSteps = 0
            steps.forEach((step) => {
                if (step.statusType === StatusType.healthy) {
                    completedSteps++
                }
            })
            setStepsCompleted(completedSteps)
        }, [steps])

        return (
            <div style={{ marginBottom: '24px' }}>
                <Card>
                    <CardBody>
                        <AcmProgressTracker
                            Title={t('status.stepbar.title')}
                            Subtitle={t('status.stepbar.subtitle', { stepsDone: stepsCompleted, steps: steps.length })}
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
