/* Copyright Contributors to the Open Cluster Management project */
import { Flex, FlexItem, Label, PageSection } from '@patternfly/react-core'

import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmPage, AcmPageHeader, AcmTable, compareStrings, IAcmTableColumn } from '../../../../ui-components'

import { PolicyRule } from '../../../../resources/kubernetes-client'
import { useMemo, useCallback } from 'react'
import { useCurrentRole } from '../RolesPage'
import { cellWidth } from '@patternfly/react-table'

export const kindToAbbreviation = (resourceOrKind: string): string => {
  // Step 1: Extract the resource name part (before any path separators)
  const resourceName = resourceOrKind.split(/[/\\?#]/)[0] || resourceOrKind

  // Complex words: virtualmachines → VIRT, persistentvolumes → PERS
  const abbrKind = resourceName.toUpperCase().slice(0, 4)
  // Using logic in openshift console code
  // https://github.com/openshift/console/blob/a228536605a2451468d172da9bb7b6ab812511ea/frontend/public/module/k8s/get-resources.ts#L29
  const blocklist = ['ASS', 'FART']
  return blocklist.includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind
}

const RolePermissions = () => {
  const { t } = useTranslation()
  const currentRole = useCurrentRole()

  const policyRules = useMemo(() => {
    if (!currentRole?.rules) return []
    return currentRole.rules
  }, [currentRole])

  const columns = useMemo<IAcmTableColumn<PolicyRule>[]>(
    () => [
      {
        header: t('Actions'),
        sort: (a: PolicyRule, b: PolicyRule) => compareStrings((a.verbs || []).join(', '), (b.verbs || []).join(', ')),
        search: (item: PolicyRule) => (item.verbs || []).join(' '),
        cell: (item) => {
          return (
            <div>
              {(item.verbs || []).map((verb, index) => (
                <div key={index}>
                  <strong>{verb}</strong>
                </div>
              ))}
            </div>
          )
        },
        transforms: [cellWidth(10)],
      },
      {
        header: t('API groups'),
        sort: (a: PolicyRule, b: PolicyRule) =>
          compareStrings((a.apiGroups || []).join(', '), (b.apiGroups || []).join(', ')),
        search: (item: PolicyRule) => (item.apiGroups || []).join(' '),
        cell: (item) => {
          const groups = item.apiGroups || []
          return groups.length > 0 ? groups.join(', ') : ''
        },
        transforms: [cellWidth(15)],
      },
      {
        header: t('Resources'),
        sort: (a: PolicyRule, b: PolicyRule) =>
          compareStrings((a.resources || []).join(', '), (b.resources || []).join(', ')),
        search: (item: PolicyRule) => (item.resources || []).join(' '),
        cell: (item) => {
          return (
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              {(item.resources || []).map((resource, index) => (
                <FlexItem key={index}>
                  <Label isCompact color="blue">
                    {kindToAbbreviation(resource)}
                  </Label>{' '}
                  {resource}
                </FlexItem>
              ))}
            </Flex>
          )
        },
        transforms: [cellWidth(60)],
      },
    ],
    [t]
  )

  const keyFn = useCallback(
    (rule: PolicyRule) =>
      `${(rule.verbs || []).join('-')}-${(rule.resources || []).join('-')}-${(rule.apiGroups || []).join('-')}`,
    []
  )

  return (
    <AcmPage header={<AcmPageHeader title={currentRole?.metadata?.name || t('Role Permissions')} />}>
      <PageSection>
        <AcmTable<PolicyRule>
          id="permissions-table"
          key="permissions-table"
          columns={columns}
          keyFn={keyFn}
          items={policyRules}
          emptyState={<div>{t('No permissions found')}</div>}
          autoHidePagination={true}
          initialPerPage={100}
          fuseThreshold={0.1}
        />
      </PageSection>
    </AcmPage>
  )
}

export { RolePermissions }
