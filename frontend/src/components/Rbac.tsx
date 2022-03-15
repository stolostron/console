/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { createSubjectAccessReview, ResourceAttributes } from '../resources'
import { AcmButton, AcmDropdown } from '@stolostron/ui-components'
import { useEffect, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'

type RbacDropdownProps<T = unknown> = {
    actions: Actions<T>[]
    item: T
    isKebab?: boolean
    text: string
    id: string
    isDisabled?: boolean
    tooltip?: string
}

type Actions<T = unknown> = {
    id: string
    text: string
    isAriaDisabled?: boolean
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
                            const isAriaDisabled = !results.every((result) => result?.status?.allowed)
                            return {
                                ...action,
                                isAriaDisabled: isAriaDisabled,
                                tooltip: isAriaDisabled ? t('rbac.unauthorized') : action.tooltip ?? '',
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
            isDisabled={props.isDisabled}
            tooltip={props.isDisabled ? props.tooltip : undefined}
        />
    )
}

type RbacButtonProps = Parameters<typeof AcmButton>[0] & {
    rbac: ResourceAttributes[]
}

const useStyles = makeStyles({
    button: {
        '& svg': {
            fill: (isDisabled: boolean) =>
                isDisabled ? 'var(--pf-global--disabled-color--200)' : 'var(--pf-global--primary-color--100)',
        },
    },
})

export function RbacButton(props: RbacButtonProps) {
    const { t } = useTranslation()
    const [isDisabled, setIsDisabled] = useState<boolean>(true)
    const [rbac] = useState<ResourceAttributes[]>(props.rbac)
    const classes = useStyles(isDisabled)

    useEffect(() => {
        Promise.all(
            rbac.map(async (rbac) => {
                return await createSubjectAccessReview(rbac).promise
            })
        ).then((results) => {
            const isDisabled = !results.every((result) => result?.status?.allowed)
            setIsDisabled(isDisabled)
        })
    }, [rbac])

    return (
        <AcmButton
            {...props}
            isDisabled={isDisabled}
            tooltip={isDisabled ? t('rbac.unauthorized') : ''}
            className={classes.button}
        />
    )
}
