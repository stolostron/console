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

    return (
        <AcmPageProcess
            isLoading={props.isLoading}
            loadingTitle={t(`${props.cluster?.status}.inprogress`, { clusterName: props.cluster?.displayName })}
            loadingMessage={
                <Trans
                    i18nKey={`cluster:${props.cluster?.status}.inprogress.message`}
                    values={{ clusterName: props.cluster?.displayName }}
                    components={{ bold: <strong /> }}
                />
            }
            successTitle={t(`${props.cluster?.status}.success`, { clusterName: props.cluster?.displayName })}
            successMessage={
                <Trans
                    i18nKey={`cluster:${props.cluster?.status}.success.message`}
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
                    {props.cluster?.status === ClusterStatus.destroying && (
                        <AcmButton
                            variant="link"
                            icon={<ExternalLinkAltIcon />}
                            iconPosition="right"
                            onClick={() => launchLogs(props.cluster!, configMaps)}
                        >
                            {t('view.logs')}
                        </AcmButton>
                    )}
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
