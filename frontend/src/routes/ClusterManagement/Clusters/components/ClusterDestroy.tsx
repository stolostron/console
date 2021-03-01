/* Copyright Contributors to the Open Cluster Management project */

import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { AcmButton, AcmPageProcess } from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { NavigationPath } from '../../../../NavigationPath'
import { launchLogs } from './HiveNotification'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { getUserAccess } from '../../../../lib/rbac-util'

export function ClusterDestroy(props: { isLoading: boolean; cluster?: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const history = useHistory()

    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
    useEffect(() => {
        const canCreateCluster = getUserAccess('create', ManagedClusterDefinition)
        canCreateCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateCluster.abort()
    }, [])

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
                            onClick={() => launchLogs(props.cluster)}
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
            secondaryActions={
                <>
                    <AcmButton
                        isDisabled={!canCreateCluster}
                        tooltip={t('common:rbac.unauthorized')}
                        variant="link"
                        onClick={() => history.push(NavigationPath.createCluster)}
                    >
                        {t('managed.createCluster')}
                    </AcmButton>
                    <AcmButton
                        isDisabled={!canCreateCluster}
                        tooltip={t('common:rbac.unauthorized')}
                        variant="link"
                        onClick={() => history.push(NavigationPath.importCluster)}
                    >
                        {t('managed.importCluster')}
                    </AcmButton>
                </>
            }
        />
    )
}
