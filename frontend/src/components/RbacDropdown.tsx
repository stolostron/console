import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AcmDropdown } from '@open-cluster-management/ui-components'
import { ResourceAttributes, createSubjectAccessReview } from '../resources/self-subject-access-review'

type RbacDropdownProps<T = unknown> = {
    actions: Actions<T>[]
    item: T
    isKebab?: boolean
    text: string
    id: string
}

type Actions<T = unknown> = {
    id: string
    text: string
    isDisabled?: boolean
    tooltip?: string
    click: (item: T) => void
    rbac?: ResourceAttributes[]
}

export function RbacDropdown<T = unknown>(props: RbacDropdownProps<T>) {
    const { t } = useTranslation()
    const [actions, setActions] = useState<Actions<T>[]>([])

    useEffect(() => {
        const isUpdated = !props.actions.every((a, i) => a?.id === actions?.[i]?.id)
        if (isUpdated) {
            setActions(props.actions)
        }
    }, [actions, props.actions])

    const onSelect = (id: string) => {
        const action = props.actions.find((a) => a.id === id)
        return action?.click(props.item)
    }

    const onToggle = async (isOpen?: boolean) => {
        if (isOpen) {
            const rbacActions: Actions<T>[] = await Promise.all(
                props.actions.map(async (action) => {
                    try {
                        if (action.rbac && action.rbac.length > 0) {
                            const results = await Promise.all(
                                action.rbac.map(async (rbac) => {
                                    return await createSubjectAccessReview(rbac).promise
                                })
                            )
                            const isDisabled = !results.every((result) => result?.status?.allowed)
                            return {
                                ...action,
                                isDisabled,
                                tooltip: isDisabled ? t('common:rbac.unauthorized') : '',
                            }
                        } else {
                            return action
                        }
                    } catch (err) {
                        return action
                    }
                })
            )
            setActions(rbacActions)
        }
    }

    return (
        <AcmDropdown
            id={props.id}
            onSelect={onSelect}
            dropdownItems={actions}
            isKebab={props.isKebab}
            isPlain={true}
            text={props.text}
            onToggle={onToggle}
        />
    )
}
