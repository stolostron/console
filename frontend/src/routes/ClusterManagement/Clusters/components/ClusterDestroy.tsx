/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { useHistory } from 'react-router-dom'
import { AcmButton, AcmPageProcess } from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { NavigationPath } from '../../../../NavigationPath'
import { launchLogs } from './HiveNotification'
import { AddCluster } from './AddCluster'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { configMapsState } from '../../../../atoms'

export function ClusterDestroy(props: { isLoading: boolean; cluster?: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const history = useHistory()
    const [configMaps] = useRecoilState(configMapsState)

    return (
        <AcmPageProcess
            isLoading={props.isLoading}
            loadingTitle={t(`${props.cluster?.status}.inprogress`, { clusterName: props.cluster?.name })}
            loadingMessage={t(`${props.cluster?.status}.inprogress.message`, { clusterName: props.cluster?.name })}
            successTitle={t(`${props.cluster?.status}.success`, { clusterName: props.cluster?.name })}
            successMessage={t(`${props.cluster?.status}.success.message`, { clusterName: props.cluster?.name })}
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
