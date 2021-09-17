/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterClaim,
    ClusterClaimApiVersion,
    ClusterClaimKind,
    ClusterPool,
    createResource,
    getResource,
    managedClusterSetLabel,
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
    const { t } = useTranslation(['cluster', 'common'])
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
            title={!claimed ? t('clusterClaim.create.title') : t('clusterClaim.create.title.success')}
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
                                        i18nKey="cluster:clusterClaim.create.message"
                                        values={{ clusterPoolName: props.clusterPool?.metadata.name }}
                                        components={{ bold: <strong /> }}
                                    />
                                </div>
                                &nbsp;
                                <AcmTextInput
                                    id="clusterClaimName"
                                    label={t('clusterClaim.name.label')}
                                    placeholder={t('clusterClaim.name.placeholder')}
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
                                        label={t('common:claim')}
                                        processingLabel={t('common:claiming')}
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
                                                                title: t('common:error'),
                                                                message: t('clusterClaim.create.timeOut'),
                                                            })
                                                        }
                                                        return resolve()
                                                    })
                                                    .catch((e) => {
                                                        if (e instanceof Error) {
                                                            alertContext.addAlert({
                                                                type: 'danger',
                                                                title: t('common:request.failed'),
                                                                message: e.message,
                                                            })
                                                            reject(e)
                                                        }
                                                    })
                                            })
                                        }}
                                    />
                                    <AcmButton key="cancel" variant="link" onClick={props.onClose}>
                                        {t('common:cancel')}
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
                            i18nKey="cluster:clusterClaim.create.message.success"
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
                            <DescriptionListTerm>{t('clusterClaim.cluster.name')}</DescriptionListTerm>
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
                        {t('clusterClaim.modal.viewCluster')}
                    </AcmButton>
                    <AcmButton key="cancel" variant="link" onClick={reset}>
                        {t('common:close')}
                    </AcmButton>
                </>
            )}
        </AcmModal>
    )
}
