/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterClaim,
    ClusterClaimApiVersion,
    ClusterClaimKind,
    ClusterPool,
    createResource,
    getResource,
} from '../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmForm,
    AcmModal,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    ModalVariant,
} from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../NavigationPath'

export type ClusterClaimModalProps = {
    clusterPool?: ClusterPool
    onClose?: () => void
}

export function ClusterClaimModal(props: ClusterClaimModalProps) {
    const { t } = useTranslation()
    const history = useHistory()
    const [clusterClaim, setClusterClaim] = useState<ClusterClaim | undefined>()
    const [claimed, setClaimed] = useState<boolean>(false)

    useEffect(() => {
        if (props.clusterPool) {
            setClusterClaim({
                apiVersion: ClusterClaimApiVersion,
                kind: ClusterClaimKind,
                metadata: {
                    name: '',
                    namespace: props.clusterPool?.metadata.namespace,
                },
                spec: {
                    clusterPoolName: props.clusterPool?.metadata.name!,
                    lifetime: undefined,
                },
            })
        } else if (!props.clusterPool) {
            setClusterClaim(undefined)
        }
    }, [props.clusterPool])

    function updateClusterClaim(update: (clusterClaim: ClusterClaim) => void) {
        const copy = { ...clusterClaim } as ClusterClaim
        update(copy)
        setClusterClaim(copy)
    }

    function reset() {
        props.onClose?.()
        setClaimed(false)
        setClusterClaim(undefined)
    }

    function pollClaim(createdClaim: ClusterClaim) {
        let retries = 10
        const poll = async (resolve: any) => {
            if (retries === 0) {
                return resolve(undefined)
            }
            const request = await getResource(createdClaim).promise
            if (request?.spec?.namespace) {
                return resolve(request)
            } else {
                retries--
                setTimeout(() => poll(resolve), 500)
            }
        }
        return new Promise(poll)
    }

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={!claimed ? t('Claim cluster') : t('Cluster successfully claimed')}
            titleIconVariant={!claimed ? undefined : 'success'}
            isOpen={!!props.clusterPool}
            onClose={reset}
        >
            {!claimed ? (
                <AcmForm style={{ gap: 0 }}>
                    <AcmAlertContext.Consumer>
                        {(alertContext) => (
                            <>
                                <div>
                                    <Trans
                                        // TODO : handle interpolation
                                        i18nKey="Claiming a cluster from <bold>{{clusterPoolName}}</bold> will remove one of the available clusters from the pool and a new cluster will be created to replace it."
                                        values={{ clusterPoolName: props.clusterPool?.metadata.name }}
                                        components={{ bold: <strong /> }}
                                    />
                                </div>
                                &nbsp;
                                <AcmTextInput
                                    id="clusterClaimName"
                                    label={t('Cluster claim name')}
                                    placeholder={t('Enter cluster claim name')}
                                    value={clusterClaim?.metadata?.name}
                                    isRequired
                                    onChange={(name) => {
                                        updateClusterClaim((clusterClaim) => {
                                            clusterClaim.metadata.name = name
                                        })
                                    }}
                                />
                                <AcmAlertGroup isInline canClose />
                                <ActionGroup>
                                    <AcmSubmit
                                        id="claim"
                                        variant="primary"
                                        label={t('Claim')}
                                        processingLabel={t('Claiming')}
                                        onClick={async () => {
                                            alertContext.clearAlerts()
                                            return new Promise(async (resolve, reject) => {
                                                const request = createResource(clusterClaim!)
                                                request.promise
                                                    .then(async (result) => {
                                                        const updatedClaim = (await pollClaim(result)) as ClusterClaim
                                                        if (updatedClaim) {
                                                            setClusterClaim(updatedClaim)
                                                            setClaimed(true)
                                                        } else {
                                                            alertContext.addAlert({
                                                                type: 'danger',
                                                                title: t('Error'),
                                                                message: t(
                                                                    'Timed out waiting for a cluster to be assigned to the claim. Try checking the cluster claim later.'
                                                                ),
                                                            })
                                                        }
                                                        return resolve()
                                                    })
                                                    .catch((e) => {
                                                        if (e instanceof Error) {
                                                            alertContext.addAlert({
                                                                type: 'danger',
                                                                title: t('Request failed'),
                                                                message: e.message,
                                                            })
                                                            reject(e)
                                                        }
                                                    })
                                            })
                                        }}
                                    />
                                    <AcmButton key="cancel" variant="link" onClick={props.onClose}>
                                        {t('Cancel')}
                                    </AcmButton>
                                </ActionGroup>
                            </>
                        )}
                    </AcmAlertContext.Consumer>
                </AcmForm>
            ) : (
                <>
                    <p>
                        <Trans
                            i18nKey="A cluster was successfully claimed from <bold>{{clusterPoolName}}</bold>. The cluster may be resuming from a Hibernating state, and will take a few minutes to power back on."
                            values={{ clusterPoolName: clusterClaim?.spec?.clusterPoolName! }}
                            components={{ bold: <strong /> }}
                        />
                    </p>
                    <DescriptionList
                        isHorizontal
                        isAutoColumnWidths
                        style={{ marginBottom: '24px', marginTop: '16px' }}
                    >
                        {/* <DescriptionListGroup>
                            <DescriptionListTerm>{t('clusterClaim.cluster.displayName')}</DescriptionListTerm>
                            <DescriptionListDescription>{clusterClaim?.metadata!.name!}</DescriptionListDescription>
                        </DescriptionListGroup> */}
                        <DescriptionListGroup>
                            <DescriptionListTerm>{t('Cluster name')}</DescriptionListTerm>
                            <DescriptionListDescription>{clusterClaim?.spec!.namespace!}</DescriptionListDescription>
                        </DescriptionListGroup>
                    </DescriptionList>
                    <AcmButton
                        key="view-cluster"
                        variant="primary"
                        role="link"
                        onClick={() =>
                            history.push(NavigationPath.clusterOverview.replace(':id', clusterClaim!.spec!.namespace!))
                        }
                    >
                        {t('View cluster')}
                    </AcmButton>
                    <AcmButton key="cancel" variant="link" onClick={reset}>
                        {t('Close')}
                    </AcmButton>
                </>
            )}
        </AcmModal>
    )
}
