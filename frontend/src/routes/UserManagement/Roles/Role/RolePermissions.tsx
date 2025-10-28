/* Copyright Contributors to the Open Cluster Management project */
import { Flex, FlexItem, Label, PageSection, Title } from '@patternfly/react-core'

import { useTranslation } from '../../../../lib/acm-i18next'
import { AcmPageContent, AcmTable, compareStrings, IAcmTableColumn } from '../../../../ui-components'
import './RolePermissions.css'

import { Rule, mapRule } from '../../../../resources/kubernetes-client'
import { useMemo, useCallback } from 'react'
import { useCurrentRole } from '../RolesPage'
import { cellWidth } from '@patternfly/react-table'

type ActionsCellProps = {
  verbs: string[]
}

const ActionsCell = ({ verbs }: ActionsCellProps) => (
  <div>
    {verbs.map((verb) => (
      <div key={verb}>
        <strong>{verb}</strong>
      </div>
    ))}
  </div>
)

type ResourcesCellProps = {
  resources: string[]
}

const ResourcesCell = ({ resources }: ResourcesCellProps) => (
  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
    {resources.map((resource) => (
      <FlexItem key={resource}>
        <Label isCompact color="blue">
          {kindToAbbreviation(resource)}
        </Label>{' '}
        {resource}
      </FlexItem>
    ))}
  </Flex>
)

const kindToAbbreviation = (resourceOrKind: string): string => {
  // Step 1: Extract the resource name part (before any path separators)
  const resourceName = resourceOrKind.split(/[/\\?#]/)[0] || resourceOrKind

  // Complex words: virtualmachines → VIRT, persistentvolumes → PERS
  const abbrKind = resourceName.toUpperCase().slice(0, 4)
  // Using logic in openshift console code
  // https://github.com/openshift/console/blob/a228536605a2451468d172da9bb7b6ab812511ea/frontend/public/module/k8s/get-resources.ts#L29
  return ['ASS', 'FART'].includes(abbrKind) ? abbrKind.slice(0, -1) : abbrKind
}
// TODO: trigger sonar issue
const RolePermissions = () => {
  const { t } = useTranslation()
  const currentRole = useCurrentRole()

  const rules = useMemo(() => currentRole?.rules?.map(mapRule) ?? [], [currentRole])

  const columns = useMemo<IAcmTableColumn<Rule>[]>(
    () => [
      {
        header: t('Actions'),
        sort: (a: Rule, b: Rule) => compareStrings(a.verbs.join(', '), b.verbs.join(', ')),
        search: (item: Rule) => item.verbs.join(' '),
        cell: (item) => <ActionsCell verbs={item.verbs} />,
        transforms: [cellWidth(10)],
      },
      {
        header: t('API groups'),
        sort: (a: Rule, b: Rule) => compareStrings(a.apiGroups.join(', '), b.apiGroups.join(', ')),
        search: (item: Rule) => item.apiGroups.join(' '),
        cell: (item) => {
          const groups = item.apiGroups
          return groups.length > 0 ? groups.join(', ') : ''
        },
        transforms: [cellWidth(15)],
      },
      {
        header: t('Resources'),
        sort: (a: Rule, b: Rule) => compareStrings(a.resources.join(', '), b.resources.join(', ')),
        search: (item: Rule) => item.resources.join(' '),
        cell: (item) => <ResourcesCell resources={item.resources} />,
        transforms: [cellWidth(60)],
      },
    ],
    [t]
  )

  const keyFn = useCallback(
    (rule: Rule) => `${rule.verbs.join('-')}-${rule.resources.join('-')}-${rule.apiGroups.join('-')}`,
    []
  )

  return (
    <AcmPageContent id="role-permissions">
      <PageSection className="wide-search-input">
        <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
          {t('Permissions')}
        </Title>
        <AcmTable<Rule>
          id="permissions-table"
          key="permissions-table"
          columns={columns}
          keyFn={keyFn}
          items={rules}
          emptyState={<div>{t('No permissions found')}</div>}
          autoHidePagination={true}
          initialPerPage={100}
          fuseThreshold={0.1}
          searchPlaceholder={t('Filter actions by text or resources...')}
        />
      </PageSection>
    </AcmPageContent>
  )
}

export { RolePermissions }
