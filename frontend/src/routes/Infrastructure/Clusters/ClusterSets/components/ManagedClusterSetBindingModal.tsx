/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmSubmit,
    AcmModal,
    AcmMultiSelect,
} from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { ActionGroup, Button, ModalVariant, SelectVariant, SelectOption } from '@patternfly/react-core'
import { ManagedClusterSet } from '../../../../../resources/managed-cluster-set'
import {
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
} from '../../../../../resources/managed-cluster-set-binding'
import { managedClusterSetBindingsState, namespacesState } from '../../../../../atoms'
import { createResource, deleteResource, resultsSettled } from '../../../../../lib/resource-request'

export function useClusterSetBindings(clusterSet?: ManagedClusterSet) {
    const [managedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)

    if (clusterSet) {
        return managedClusterSetBindings.filter((mcsb) => mcsb.spec.clusterSet === clusterSet.metadata.name!)
    } else {
        return []
    }
}

export function ManagedClusterSetBindingModal(props: { clusterSet?: ManagedClusterSet; onClose: () => void }) {
    const { t } = useTranslation(['cluster', 'common'])
    const [namespaces] = useRecoilState(namespacesState)
    const clusterSetBindings = useClusterSetBindings(props.clusterSet)
    const [selectedNamespaces, setSelectedNamespaces] = useState<string[] | undefined>(undefined)
    const [loaded, setLoaded] = useState<boolean>(false)

    function reset() {
        props.onClose?.()
        setSelectedNamespaces([])
        setLoaded(false)
    }

    useEffect(() => {
        if (props.clusterSet && !loaded) {
            setLoaded(true)
            const clusterSetBindingNamespaces = clusterSetBindings.map((mcsb) => mcsb.metadata.namespace!)
            setSelectedNamespaces(clusterSetBindingNamespaces)
        }
    }, [props.clusterSet, clusterSetBindings, loaded])

    return (
        <AcmModal
            title={t('clusterSetBinding.edit.title')}
            isOpen={props.clusterSet !== undefined}
            variant={ModalVariant.medium}
            onClose={reset}
        >
            <AcmAlertContext.Consumer>
                {(alertContext) => (
                    <AcmForm style={{ gap: 0 }}>
                        <div style={{ marginBottom: '16px' }}>
                            <Trans i18nKey="cluster:clusterSetBinding.edit.message" components={{ bold: <strong /> }} />
                        </div>

                        <AcmMultiSelect
                            id="namespaces"
                            variant={SelectVariant.typeaheadMulti}
                            label={t('clusterSetBinding.edit.select.label')}
                            placeholder={t('clusterSetBinding.edit.select.placeholder')}
                            value={selectedNamespaces}
                            onChange={(namespaces) => setSelectedNamespaces(namespaces)}
                        >
                            {namespaces.map((namespace) => {
                                return (
                                    <SelectOption key={namespace.metadata.name} value={namespace.metadata.name!}>
                                        {namespace.metadata.name}
                                    </SelectOption>
                                )
                            })}
                        </AcmMultiSelect>

                        <AcmAlertGroup isInline canClose />
                        <ActionGroup>
                            <AcmSubmit
                                id="save-bindings"
                                variant="primary"
                                label={t('common:save')}
                                processingLabel={t('common:saving')}
                                onClick={() => {
                                    alertContext.clearAlerts()
                                    return new Promise(async (resolve, reject) => {
                                        const newNamespaces = selectedNamespaces?.filter(
                                            (ns) =>
                                                clusterSetBindings.find((mcsb) => mcsb.metadata.namespace === ns) ===
                                                undefined
                                        )
                                        const removedBindings = clusterSetBindings.filter(
                                            (mcsb) =>
                                                selectedNamespaces?.find((ns) => ns === mcsb.metadata.namespace) ===
                                                undefined
                                        )

                                        const calls: any[] = []
                                        newNamespaces?.forEach((namespace) => {
                                            const resource: ManagedClusterSetBinding = {
                                                apiVersion: ManagedClusterSetBindingApiVersion,
                                                kind: ManagedClusterSetBindingKind,
                                                metadata: {
                                                    name: props.clusterSet!.metadata.name,
                                                    namespace: namespace,
                                                },
                                                spec: {
                                                    clusterSet: props.clusterSet!.metadata.name!,
                                                },
                                            }
                                            calls.push(createResource<ManagedClusterSetBinding>(resource))
                                        })

                                        removedBindings.forEach((mcsb) =>
                                            calls.push(deleteResource<ManagedClusterSetBinding>(mcsb))
                                        )

                                        const requests = resultsSettled(calls)
                                        const results = await requests.promise
                                        const errors: string[] = []
                                        results.forEach((res) => {
                                            if (res.status === 'rejected') {
                                                errors.push(res.reason)
                                            }
                                        })

                                        if (errors.length > 0) {
                                            alertContext.addAlert({
                                                type: 'danger',
                                                title: t('common:request.failed'),
                                                message: `${errors.map((error) => `${error} \n`)}`,
                                            })
                                            reject()
                                        } else {
                                            resolve(results)
                                            reset()
                                        }
                                    })
                                }}
                            />
                            <Button variant="link" onClick={reset}>
                                {t('common:cancel')}
                            </Button>
                        </ActionGroup>
                    </AcmForm>
                )}
            </AcmAlertContext.Consumer>
        </AcmModal>
    )
}
