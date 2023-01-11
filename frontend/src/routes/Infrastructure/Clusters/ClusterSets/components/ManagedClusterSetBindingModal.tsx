/* Copyright Contributors to the Open Cluster Management project */

import {
    createResource,
    deleteResource,
    ManagedClusterSet,
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingDefinition,
    ManagedClusterSetBindingKind,
    resultsSettled,
    SelfSubjectAccessReview,
} from '../../../../../resources'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmModal,
    AcmMultiSelect,
    AcmSubmit,
} from '../../../../../ui-components'
import { ActionGroup, Button, ModalVariant, SelectOption, SelectVariant } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { canUser } from '../../../../../lib/rbac-util'

export function useClusterSetBindings(clusterSet?: ManagedClusterSet) {
    const { managedClusterSetBindingsState } = useSharedAtoms()
    const [managedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)

    if (clusterSet) {
        return managedClusterSetBindings.filter((mcsb) => mcsb.spec.clusterSet === clusterSet.metadata.name!)
    } else {
        return []
    }
}

const isPromiseFulfilledResult = (result: PromiseSettledResult<any>): result is PromiseFulfilledResult<any> =>
    result.status === 'fulfilled'

const getAllowedNamespaces = (results: PromiseSettledResult<SelfSubjectAccessReview>[]) =>
    results
        .filter(isPromiseFulfilledResult) //Filter out rejected promises
        .map((result) => result.value)
        .filter((ssar) => ssar.status?.allowed) // Check if RBAC was allowed
        .map((ssar) => ssar.spec.resourceAttributes.namespace)
        .filter((value): value is string => !!value)

export function ManagedClusterSetBindingModal(props: { clusterSet?: ManagedClusterSet; onClose: () => void }) {
    const { t } = useTranslation()
    const { namespacesState } = useSharedAtoms()
    const [namespaces] = useRecoilState(namespacesState)
    const clusterSetBindings = useClusterSetBindings(props.clusterSet)
    const [selectedNamespaces, setSelectedNamespaces] = useState<string[] | undefined>(undefined)
    const [rbacNamespaces, setRbacNamespaces] = useState<string[] | undefined>(undefined)
    const [loaded, setLoaded] = useState<boolean>(false)
    const [canCreateDeleteManagedClusterSet, setCanCreateDeleteManagedClusterSet] = useState<boolean>(false)

    function reset() {
        props.onClose?.()
        setSelectedNamespaces([])
        setLoaded(false)
    }
    const clusterSetBindingNamespaces = clusterSetBindings.map((mcsb) => mcsb.metadata.namespace!)

    useEffect(() => {
        if (props.clusterSet && !loaded) {
            const getNamespaces = async () => {
                const canCreateManagedClusterSetPromise = canUser('create', ManagedClusterSetBindingDefinition)
                const canDeleteManagedClusterSetPromise = canUser('delete', ManagedClusterSetBindingDefinition)

                Promise.all([
                    canCreateManagedClusterSetPromise.promise,
                    canDeleteManagedClusterSetPromise.promise,
                ]).then((result) => {
                    setCanCreateDeleteManagedClusterSet(result.every((r) => r.status?.allowed!))
                })
                setSelectedNamespaces(clusterSetBindingNamespaces)
            }

            getNamespaces().catch(console.error)

            if (!canCreateDeleteManagedClusterSet) {
                const getRbacNamespaces = async () => {
                    const [namespacesWithDelete, namespacesWithCreate] = await Promise.all([
                        Promise.allSettled(
                            clusterSetBindingNamespaces.map((namespace) => {
                                return canUser('delete', ManagedClusterSetBindingDefinition, namespace).promise
                            })
                        ).then(getAllowedNamespaces),
                        Promise.allSettled(
                            namespaces.map((namespace) => {
                                return canUser('create', ManagedClusterSetBindingDefinition, namespace.metadata.name)
                                    .promise
                            })
                        ).then(getAllowedNamespaces),
                    ])
                    const availableRbacNamespaces = [...new Set([...namespacesWithDelete, ...namespacesWithCreate])]
                    setSelectedNamespaces(namespacesWithDelete)
                    setRbacNamespaces(availableRbacNamespaces)
                    setLoaded(true)
                }
                getRbacNamespaces().catch(console.error)
            }
        }
    }, [
        props.clusterSet,
        clusterSetBindings,
        loaded,
        namespaces,
        selectedNamespaces,
        canCreateDeleteManagedClusterSet,
        clusterSetBindingNamespaces,
    ])

    const namespaceDropdown = () => {
        if (canCreateDeleteManagedClusterSet) {
            return namespaces.map((namespace) => {
                return (
                    <SelectOption key={namespace.metadata.name} value={namespace.metadata.name}>
                        {namespace.metadata.name}
                    </SelectOption>
                )
            })
        } else {
            return (
                rbacNamespaces &&
                rbacNamespaces.map((namespace) => {
                    return (
                        <SelectOption key={namespace} value={namespace}>
                            {namespace}
                        </SelectOption>
                    )
                })
            )
        }
    }

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
                            <Trans i18nKey="clusterSetBinding.edit.message" components={{ bold: <strong /> }} />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <Trans i18nKey="clusterSetBinding.edit.message.rbac" components={{ bold: <strong /> }} />
                        </div>
                        <AcmMultiSelect
                            id="namespaces"
                            variant={SelectVariant.typeaheadMulti}
                            label={t('clusterSetBinding.edit.select.label')}
                            placeholder={t('clusterSetBinding.edit.select.placeholder')}
                            value={selectedNamespaces}
                            menuAppendTo="parent"
                            maxHeight="18em"
                            onChange={(namespaces) => setSelectedNamespaces(namespaces)}
                            isLoading={!loaded}
                        >
                            {namespaceDropdown()}
                        </AcmMultiSelect>

                        <AcmAlertGroup isInline canClose />
                        <ActionGroup>
                            <AcmSubmit
                                id="save-bindings"
                                variant="primary"
                                label={t('save')}
                                processingLabel={t('saving')}
                                isDisabled={!loaded}
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
                                                title: t('request.failed'),
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
                                {t('cancel')}
                            </Button>
                        </ActionGroup>
                    </AcmForm>
                )}
            </AcmAlertContext.Consumer>
        </AcmModal>
    )
}
