/* Copyright Contributors to the Open Cluster Management project */

import { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../../components/BulkActionModel'
import { RbacDropdown } from '../../../components/Rbac'
import { useTranslation } from '../../../lib/acm-i18next'
import { rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { NavigationPath } from '../../../NavigationPath'
import { patchResource, Policy, PolicyApiVersion, PolicyDefinition, PolicyKind } from '../../../resources'
import { DeletePolicyModal, PolicyTableItem } from '../policies/Policies'

export function PolicyActionDropdown(props: {
    setModal: (modal: React.ReactNode) => void
    // modal: React.ReactNode
    item: PolicyTableItem
    isKebab: boolean
}) {
    const { t } = useTranslation()
    const history = useHistory()

    const [modalProps, setModalProps] = useState<IBulkActionModelProps<PolicyTableItem> | { open: false }>({
        open: false,
    })
    const { item } = props

    const { setModal } = props

    const bulkModalStatusColumns = useMemo(
        () => [
            {
                header: t('policy.tableHeader.name'),
                cell: 'policy.metadata.name',
                sort: 'policy.metadata.name',
            },
            {
                header: t('policy.table.actionGroup.status'),
                cell: (item: PolicyTableItem) => (
                    <span>
                        {item.policy.spec.disabled === true
                            ? t('policy.table.actionGroup.status.disabled')
                            : t('policy.table.actionGroup.status.enabled')}
                    </span>
                ),
            },
        ],
        [t]
    )

    const bulkModalRemediationColumns = useMemo(
        () => [
            {
                header: t('policy.tableHeader.name'),
                cell: 'policy.metadata.name',
                sort: 'policy.metadata.name',
            },
            {
                header: t('policy.table.actionGroup.status'),
                cell: (item: PolicyTableItem) => (
                    <span>
                        {item.policy.spec.remediationAction === t('policy.table.actions.inform').toLowerCase()
                            ? t('policy.table.actions.inform')
                            : t('policy.table.actions.enforce')}
                    </span>
                ),
            },
        ],
        [t]
    )

    const actions = useMemo(
        () => [
            {
                id: 'enable-policy',
                text: t('Enable'),
                tooltip: item.policy.spec.disabled ? 'Enable policy' : 'Policy is already enabled',
                isAriaDisabled: item.policy.spec.disabled === false,
                click: (item: PolicyTableItem) => {
                    setModalProps({
                        open: true,
                        title: t('policy.modal.title.enable'),
                        action: t('policy.table.actions.enable'),
                        processing: t('policy.table.actions.enabling'),
                        resources: [item],
                        description: t('policy.modal.message.enable'),
                        columns: bulkModalStatusColumns,
                        keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                        actionFn: (item: PolicyTableItem) => {
                            return patchResource(
                                {
                                    apiVersion: PolicyApiVersion,
                                    kind: PolicyKind,
                                    metadata: {
                                        name: item.policy.metadata.name,
                                        namespace: item.policy.metadata.namespace,
                                    },
                                } as Policy,
                                [{ op: 'replace', path: '/spec/disabled', value: false }]
                            )
                        },
                        close: () => {
                            setModalProps({ open: false })
                        },
                        hasExternalResources: item.source !== 'Local',
                    })
                },
                rbac: item.policy.spec.disabled
                    ? [rbacPatch(PolicyDefinition, item.policy.metadata.namespace)]
                    : undefined,
            },
            {
                id: 'disable-policy',
                text: t('policy.table.actions.disable'),
                tooltip: item.policy.spec.disabled ? 'Policy is already disabled' : 'Disable policy',
                isAriaDisabled: item.policy.spec.disabled === true,
                click: (item: PolicyTableItem) => {
                    setModalProps({
                        open: true,
                        title: t('policy.modal.title.disable'),
                        action: t('policy.table.actions.disable'),
                        processing: t('policy.table.actions.disabling'),
                        resources: [item],
                        description: t('policy.modal.message.disable'),
                        columns: bulkModalStatusColumns,
                        keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                        actionFn: (item) => {
                            return patchResource(
                                {
                                    apiVersion: PolicyApiVersion,
                                    kind: PolicyKind,
                                    metadata: {
                                        name: item.policy.metadata.name,
                                        namespace: item.policy.metadata.namespace,
                                    },
                                } as Policy,
                                [{ op: 'replace', path: '/spec/disabled', value: true }]
                            )
                        },
                        close: () => {
                            setModalProps({ open: false })
                        },
                        hasExternalResources: item.source !== 'Local',
                    })
                },
                rbac: item.policy.spec.disabled
                    ? undefined
                    : [rbacPatch(PolicyDefinition, item.policy.metadata.namespace)],
            },
            {
                id: 'inform-policy',
                text: t('policy.table.actions.inform'),
                tooltip: item.policy.spec.remediationAction === 'inform' ? 'Already informing' : 'Inform policy',
                addSeparator: true,
                isAriaDisabled: item.policy.spec.remediationAction === 'inform',
                click: (item: PolicyTableItem) => {
                    setModalProps({
                        open: true,
                        title: t('policy.modal.title.inform'),
                        action: t('policy.table.actions.inform'),
                        processing: t('policy.table.actions.informing'),
                        resources: [item],
                        description: t('policy.modal.message.inform'),
                        columns: bulkModalRemediationColumns,
                        keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                        actionFn: (item) => {
                            return patchResource(
                                {
                                    apiVersion: PolicyApiVersion,
                                    kind: PolicyKind,
                                    metadata: {
                                        name: item.policy.metadata.name,
                                        namespace: item.policy.metadata.namespace,
                                    },
                                } as Policy,
                                [{ op: 'replace', path: '/spec/remediationAction', value: 'inform' }]
                            )
                        },
                        close: () => {
                            setModalProps({ open: false })
                        },
                        hasExternalResources: item.source !== 'Local',
                    })
                },
                rbac:
                    item.policy.spec.remediationAction === 'inform'
                        ? undefined
                        : [rbacPatch(PolicyDefinition, item.policy.metadata.namespace)],
            },
            {
                id: 'enforce-policy',
                text: t('policy.table.actions.enforce'),
                tooltip: item.policy.spec.remediationAction === 'enforce' ? 'Already enforcing' : 'Enforce policy',
                isAriaDisabled: item.policy.spec.remediationAction === 'enforce',
                click: (item: PolicyTableItem) => {
                    setModalProps({
                        open: true,
                        title: t('policy.modal.title.enforce'),
                        action: t('policy.table.actions.enforce'),
                        processing: t('policy.table.actions.enforcing'),
                        resources: [item],
                        description: t('policy.modal.message.enforce'),
                        columns: bulkModalRemediationColumns,
                        keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                        actionFn: (item) => {
                            return patchResource(
                                {
                                    apiVersion: PolicyApiVersion,
                                    kind: PolicyKind,
                                    metadata: {
                                        name: item.policy.metadata.name,
                                        namespace: item.policy.metadata.namespace,
                                    },
                                } as Policy,
                                [{ op: 'replace', path: '/spec/remediationAction', value: 'enforce' }]
                            )
                        },
                        close: () => {
                            setModalProps({ open: false })
                        },
                        hasExternalResources: item.source !== 'Local',
                    })
                },
                rbac:
                    item.policy.spec.remediationAction === 'enforce'
                        ? undefined
                        : [rbacPatch(PolicyDefinition, item.policy.metadata.namespace)],
            },
            {
                id: 'edit-policy',
                text: t('Edit'),
                tooltip: 'Edit policy',
                addSeparator: true,
                click: (item: PolicyTableItem) => {
                    history.push(
                        NavigationPath.editPolicy
                            .replace(':namespace', item.policy.metadata.namespace!)
                            .replace(':name', item.policy.metadata.name!)
                    )
                },
                rbac: [rbacPatch(PolicyDefinition, item.policy.metadata.namespace)],
            },
            {
                id: 'delete-policy',
                text: t('Delete'),
                tooltip: 'Delete policy',
                addSeparator: true,
                click: (policy: PolicyTableItem) => {
                    setModal(<DeletePolicyModal item={policy} onClose={() => setModal(undefined)} />)
                },
                rbac: [rbacDelete(PolicyDefinition, item.policy.metadata.namespace, item.policy.metadata.name)],
            },
        ],
        [
            bulkModalRemediationColumns,
            bulkModalStatusColumns,
            history,
            item.policy.metadata.name,
            item.policy.metadata.namespace,
            item.policy.spec.disabled,
            item.policy.spec.remediationAction,
            setModal,
            t,
        ]
    )

    return (
        <>
            <BulkActionModel<PolicyTableItem> {...modalProps} />
            {actions && actions.length > 0 && (
                <RbacDropdown<PolicyTableItem>
                    id={`${item.policy.metadata.name}-actions`}
                    item={item}
                    isKebab={props.isKebab}
                    text={t('actions')}
                    actions={actions}
                />
            )}
        </>
    )
}
