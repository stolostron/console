/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { Cluster, ClusterStatus } from '../../../../../resources'
import { AcmButton, AcmPageProcess, Provider } from '@stolostron/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { configMapsState } from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { AddCluster } from './AddCluster'
import { launchLogs } from './HiveNotification'
import { CIM } from 'openshift-assisted-ui-lib'
import { ButtonVariant } from '@patternfly/react-core'
import { ClusterContext } from '../../../../../routes/Infrastructure/Clusters/ManagedClusters/ClusterDetails/ClusterDetails'

const { LogsDownloadButton } = CIM

export function ClusterDestroy(props: { isLoading: boolean; cluster?: Cluster }) {
    const { t } = useTranslation()
    const history = useHistory()
    const [configMaps] = useRecoilState(configMapsState)
    const isHybrid = props.cluster?.provider === Provider.hybrid
    const { agentClusterInstall } = useContext(ClusterContext)

    return (
        <AcmPageProcess
            isLoading={props.isLoading}
            loadingTitle={t(`${props.cluster?.status}.inprogress`, { clusterName: props.cluster?.displayName })}
            loadingMessage={
                <Trans
                    i18nKey={`${props.cluster?.status}.inprogress.message`}
                    values={{ clusterName: props.cluster?.displayName }}
                    components={{ bold: <strong /> }}
                />
            }
            successTitle={t(`${props.cluster?.status}.success`, { clusterName: props.cluster?.displayName })}
            successMessage={
                <Trans
                    i18nKey={`${props.cluster?.status}.success.message`}
                    values={{ clusterName: props.cluster?.displayName }}
                    components={{ bold: <strong /> }}
                />
            }
            loadingPrimaryAction={
                <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                    {t('button.backToClusters')}
                </AcmButton>
            }
            loadingSecondaryActions={
                <>
                    {props.cluster?.status === ClusterStatus.destroying &&
                        (!isHybrid ? (
                            <AcmButton
                                variant="link"
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="right"
                                onClick={() => launchLogs(props.cluster!, configMaps)}
                            >
                                {t('view.logs')}
                            </AcmButton>
                        ) : (
                            <LogsDownloadButton
                                id="cluster-logs-button"
                                agentClusterInstall={agentClusterInstall}
                                variant={ButtonVariant.link}
                            />
                        ))}
                </>
            }
            primaryAction={
                <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                    {t('button.backToClusters')}
                </AcmButton>
            }
            secondaryActions={<AddCluster type="button" buttonType="link" />}
        />
    )
}
