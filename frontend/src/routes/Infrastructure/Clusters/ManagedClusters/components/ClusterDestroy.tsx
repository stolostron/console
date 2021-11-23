/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../resources'
import { AcmButton, AcmPageProcess } from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { configMapsState } from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { AddCluster } from './AddCluster'
import { launchLogs } from './HiveNotification'

export function ClusterDestroy(props: { isLoading: boolean; cluster?: Cluster }) {
    const { t } = useTranslation()
    const history = useHistory()
    const [configMaps] = useRecoilState(configMapsState)

    function getLoadingMessageI18nKey(clusterStatus: ClusterStatus, t: (string: String) => string) {
        switch (clusterStatus) {
            case 'detaching':
                return t(
                    'It might take a few minutes for the detach process to complete. Select <bold>Back to clusters</bold> or wait here.'
                )
            case 'destroying':
                return t(
                    'It might take a few minutes for the destroy process to complete. Select <bold>Back to clusters</bold> or <bold>View logs</bold> to see the cluster destroy logs, or wait here.'
                )
            default:
                break
        }
    }
    function getSuccessMessageI18nKey(clusterStatus: ClusterStatus, t: (string: String) => string) {
        switch (clusterStatus) {
            case 'detaching':
                return t(
                    '{{clusterName}} was successfully detached. Select <bold>Back to clusters</bold> or create a new cluster.'
                )
            case 'destroying':
                return t(
                    '{{clusterName}} was successfully destroyed. Select <bold>Back to clusters</bold> or create a new cluster.'
                )
            default:
                break
        }
    }

    return (
        <AcmPageProcess
            isLoading={props.isLoading}
            loadingTitle={t(`${props.cluster?.status}.inprogress`, { clusterName: props.cluster?.displayName })}
            loadingMessage={
                <Trans
                    i18nKey={getLoadingMessageI18nKey(props.cluster!.status, t)}
                    values={{ clusterName: props.cluster?.displayName }}
                    components={{ bold: <strong /> }}
                />
            }
            successTitle={t(`${props.cluster?.status}.success`, { clusterName: props.cluster?.displayName })}
            successMessage={
                <Trans
                    i18nKey={getSuccessMessageI18nKey(props.cluster!.status, t)}
                    // i18nKey={`cluster:${props.cluster?.status}.success.message`}
                    values={{ clusterName: props.cluster?.displayName }}
                    components={{ bold: <strong /> }}
                />
            }
            loadingPrimaryAction={
                <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                    {t('Back to clusters')}
                </AcmButton>
            }
            loadingSecondaryActions={
                <>
                    {props.cluster?.status === ClusterStatus.destroying && (
                        <AcmButton
                            variant="link"
                            icon={<ExternalLinkAltIcon />}
                            iconPosition="right"
                            onClick={() => launchLogs(props.cluster!, configMaps)}
                        >
                            {t('View logs')}
                        </AcmButton>
                    )}
                </>
            }
            primaryAction={
                <AcmButton role="link" onClick={() => history.push(NavigationPath.clusters)}>
                    {t('Back to clusters')}
                </AcmButton>
            }
            secondaryActions={<AddCluster type="button" buttonType="link" />}
        />
    )
}
