import { useTranslation } from '../../lib/acm-i18next'
import { Stack, StackItem, Title } from '@patternfly/react-core'
import { AcmLabels } from '../../ui-components'

export interface RoleBindingSectionProps {
  title: string
  clusterRoles: any[]
  idPrefix: string
  isViewing: boolean
  isRequired: boolean
  selectedNamespaces: string[]
  selectedSubjectNames: string[]
  selectedRoles: string[]
  selectedSubjectType: 'User' | 'Group'
  namespaceOptions: { id: string; value: string; text: string; isDisabled?: boolean }[]
  subjectOptions: { id: string; value: string }[]
  onNamespaceChange: (values: string[]) => void
  onSubjectTypeChange: (value: string) => void
  onSubjectNameChange: (values: string[]) => void
  onRoleChange: (values: string[]) => void
}

export const RoleBindingSection = ({
  title,
  clusterRoles,
  idPrefix,
  isViewing,
  isRequired,
  selectedNamespaces,
  selectedSubjectNames,
  selectedRoles,
  selectedSubjectType,
  namespaceOptions,
  subjectOptions,
  onNamespaceChange,
  onSubjectTypeChange,
  onSubjectNameChange,
  onRoleChange,
}: RoleBindingSectionProps) => {
  const { t } = useTranslation()

  return {
    type: 'Section' as const,
    title: t(title),
    wizardTitle: t(title),
    inputs: [
      {
        id: `${idPrefix}-namespaces`,
        type: 'Multiselect' as const,
        label: t('Namespaces'),
        placeholder: t('Select or enter namespace'),
        value: selectedNamespaces,
        onChange: onNamespaceChange,
        options: namespaceOptions,
        isRequired: isRequired,
        isHidden: isViewing,
      },
      {
        id: `${idPrefix}-subject-type`,
        type: 'Radio' as const,
        label: '',
        value: selectedSubjectType.toLowerCase(),
        onChange: onSubjectTypeChange,
        options: [
          { id: `${idPrefix}-user`, value: 'user', text: t('User') },
          { id: `${idPrefix}-group`, value: 'group', text: t('Group') },
        ],
        isRequired: isRequired,
        isHidden: isViewing,
      },
      {
        id: `${idPrefix}-subject`,
        type: 'CreatableMultiselect' as const,
        label: selectedSubjectType === 'Group' ? t('Groups') : t('Users'),
        placeholder: selectedSubjectType === 'Group' ? t('Select or enter group name') : t('Select or enter user name'),
        value: selectedSubjectNames,
        onChange: onSubjectNameChange,
        options: subjectOptions,
        isRequired: isRequired,
        isHidden: isViewing,
        isCreatable: true,
      },
      {
        id: `${idPrefix}-roles`,
        type: 'Multiselect' as const,
        label: t('Roles'),
        placeholder: 'Select or enter roles',
        value: selectedRoles,
        onChange: onRoleChange,
        options: clusterRoles.filter((r) => r !== null).map((r) => ({ id: r._uid, value: r.name })),
        isRequired: isRequired,
        isHidden: isViewing,
      },
      {
        id: 'custom-labels',
        type: 'Custom' as const,
        isHidden: !isViewing,
        component: (
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h6">{t('Namespaces')}</Title>
              <AcmLabels isVertical={false} labels={selectedNamespaces} />
            </StackItem>
            <StackItem>
              <Title headingLevel="h6">{t('Users')}</Title>
              <AcmLabels isVertical={false} labels={selectedSubjectNames} />
            </StackItem>
            <StackItem>
              <Title headingLevel="h6">{t('Roles')}</Title>
              <AcmLabels isVertical={false} labels={selectedRoles} />
            </StackItem>
          </Stack>
        ),
      },
    ],
  }
}
