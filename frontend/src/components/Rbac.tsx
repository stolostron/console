/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { createSubjectAccessReview, ResourceAttributes } from '../resources'
import { AcmButton, AcmDropdown, AcmDropdownItems, AcmDropdownProps } from '../ui-components'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'

type RbacDropdownProps<T = unknown> = Pick<
  AcmDropdownProps,
  'dropdownPosition' | 'id' | 'isDisabled' | 'isKebab' | 'text' | 'tooltip'
> & {
  actions: Actions<T>[]
  item: T
}

type Actions<T = unknown> = Omit<AcmDropdownItems, 'flyoutMenu'> & {
  id: string
  text: React.ReactNode
  isAriaDisabled?: boolean
  tooltip?: string
  flyoutMenu?: Actions<T>[]
  click?: (item: T) => void
  rbac?: ResourceAttributes[] | Promise<ResourceAttributes>[]
}

function flattenActions<T>(actions: Actions<T>[]): Actions<T>[] {
  return actions.flatMap((action) => (action.flyoutMenu ? [...flattenActions(action.flyoutMenu), action] : action))
}

/**
 * A role-based access control (RBAC) dropdown component built on top of AcmDropdown.
 * Extends AcmDropdown functionality by adding permission checks and RBAC controls
 * to dropdown actions.
 *
 * @component
 * @extends {AcmDropdown}
 * @example
 * ```tsx
 * <RbacDropdown<PolicyType>
 *   id="policy-actions"
 *   text="Actions"
 *   actions={[
 *     {
 *       id: 'edit',
 *       text: 'Edit',
 *       click: (policy) => handleEdit(policy),
 *       rbac: [{
 *         apiGroup: 'policy.open-cluster-management.io',
 *         resource: 'policies',
 *         verb: 'update'
 *       }]
 *     }
 *   ]}
 *   item={policyItem}
 * />
 * ```
 *
 * @template T - The type of item the dropdown actions will operate on
 *
 * @param props - Component props extending from AcmDropdown
 * @param props.actions - Array of actions with RBAC permissions
 * @param props.item - The item that actions will operate on
 * @param props.id - Unique identifier for the dropdown
 * @param props.isDisabled - Whether the dropdown is disabled
 * @param props.isKebab - Whether to render as a kebab menu
 * @param props.text - Text to display on the dropdown button
 * @param props.tooltip - Tooltip text for disabled state
 *
 * @remarks
 * This component is built on top of AcmDropdown, as shown by its type definition:
 * ```tsx
 * type RbacDropdownProps<T = unknown> = Pick<
 *   AcmDropdownProps,
 *   'dropdownPosition' | 'id' | 'isDisabled' | 'isKebab' | 'text' | 'tooltip'
 * > & {
 *   actions: Actions<T>[]
 *   item: T
 * }
 * ```
 *
 * Key differences from AcmDropdown:
 * - Adds RBAC permission checking
 * - Handles action disabling based on permissions
 * - Adds unauthorized tooltips
 * - Manages nested menu permissions
 *
 * @returns A dropdown menu component with RBAC-protected actions
 */

export function RbacDropdown<T = unknown>(props: RbacDropdownProps<T>) {
  const { t } = useTranslation()
  const [actions, setActions] = useState<Actions<T>[]>([])

  const actionsWithFlyoutActions = useMemo(() => flattenActions(actions), [actions])

  useEffect(() => {
    const isUpdated = !props.actions.every((a, i) => a?.id === actions?.[i]?.id)
    if (isUpdated) {
      setActions(props.actions)
    }
  }, [actions, props.actions])

  const onSelect = useCallback(
    (id: string) => {
      // finds action in the flattened array that includes both the top-level and the nested actions
      const action = actionsWithFlyoutActions.find((a) => a.id === id)
      // single item action
      if (action?.click) {
        action.click(props.item)
      }
    },
    [actionsWithFlyoutActions, props.item]
  )

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
          } catch {
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
      dropdownPosition={props.dropdownPosition}
    />
  )
}

type RbacButtonProps = Parameters<typeof AcmButton>[0] & {
  rbac: ResourceAttributes[] | Promise<ResourceAttributes>[]
}

export function RbacButton(props: RbacButtonProps) {
  const { t } = useTranslation()
  const [isDisabled, setIsDisabled] = useState<boolean>(true)
  const [rbac] = useState<ResourceAttributes[] | Promise<ResourceAttributes>[]>(props.rbac)

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
      className={css({
        '& svg': {
          fill: isDisabled ? 'var(--pf-v5-global--disabled-color--200)' : 'var(--pf-v5-global--primary-color--100)',
        },
      })}
    />
  )
}
