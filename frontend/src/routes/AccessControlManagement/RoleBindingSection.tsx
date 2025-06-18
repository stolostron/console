/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { Stack, StackItem, Title } from '@patternfly/react-core'
import { AcmLabels } from '../../ui-components'
import { Section, SelectOptionInput } from '../../components/AcmFormData'

interface RoleBindingSectionProps {
  title: string
  description?: string
  clusterRoles: any[]
  idPrefix: string
  isViewing: boolean
  isRequired: boolean
  isRolesDisabled: boolean
  selectedNamespaces: string[]
  selectedSubjectNames: string[]
  selectedRoles: string[]
  selectedSubjectKind: 'User' | 'Group'
  namespaceOptions: SelectOptionInput[]
  namespaceHelperText?: string
  subjectOptions: { id: string; value: string }[]
  onNamespaceChange: (values: string[]) => void
  onSubjectKindChange: (value: string) => void
  onSubjectNameChange: (values: string[]) => void
  onRoleChange: (values: string[]) => void
}

export const RoleBindingSection = ({
  title,
  description,
  clusterRoles,
  idPrefix,
  isViewing,
  isRequired,
  isRolesDisabled,
  selectedNamespaces,
  selectedSubjectNames,
  selectedRoles,
  selectedSubjectKind,
  namespaceOptions,
  namespaceHelperText,
  subjectOptions,
  onNamespaceChange,
  onSubjectKindChange,
  onSubjectNameChange,
  onRoleChange,
}: RoleBindingSectionProps): Section | null => {
  const { t } = useTranslation()

  return isViewing && selectedRoles.length === 0 && selectedSubjectNames.length === 0
    ? null
    : {
        type: 'Section',
        title: title,
        wizardTitle: title,
        description,
        inputs: [
          {
            id: `${idPrefix}-namespaces`,
            type: 'Multiselect',
            label: t('Namespaces')!,
            placeholder: t('Select or enter namespace'),
            helperText: namespaceHelperText,
            value: selectedNamespaces,
            onChange: onNamespaceChange,
            options: namespaceOptions,
            isRequired: isRequired,
            isHidden: isViewing,
          },
          {
            id: `${idPrefix}-subject-kind`,
            type: 'Radio',
            label: '',
            value: selectedSubjectKind.toLowerCase(),
            onChange: (value: string) => {
              onSubjectKindChange(value)
            },
            options: [
              { id: `${idPrefix}-user`, value: 'user', text: t('User') },
              { id: `${idPrefix}-group`, value: 'group', text: t('Group') },
            ],
            isRequired: isRequired,
            isHidden: isViewing,
          },
          {
            id: `${idPrefix}-subject`,
            type: 'CreatableMultiselect',
            label: selectedSubjectKind === 'Group' ? t('Groups')! : t('Users')!,
            placeholder:
              selectedSubjectKind === 'Group' ? t('Select or enter group name') : t('Select or enter user name'),
            value: selectedSubjectNames,
            onChange: (values: string[]) => {
              onSubjectNameChange(values)
            },
            options: subjectOptions,
            isRequired: isRequired,
            isHidden: isViewing,
            isCreatable: true,
          },
          {
            id: `${idPrefix}-roles`,
            type: 'Multiselect',
            label: t('Roles')!,
            placeholder: 'Select or enter roles',
            value: selectedRoles,
            onChange: onRoleChange,
            options: clusterRoles.filter((r) => r !== null).map((r) => ({ id: r._uid, value: r.name })),
            isRequired: isRequired,
            isHidden: isViewing,
            isDisabled: isRolesDisabled,
          },
          {
            id: 'custom-labels',
            type: 'Custom',
            isHidden: !isViewing,
            component: (
              <Stack hasGutter>
                <StackItem>
                  <Title headingLevel="h6">{t('Namespaces')}</Title>
                  <AcmLabels isVertical={false} labels={selectedNamespaces} />
                </StackItem>
                <StackItem>
                  <Title headingLevel="h6">{selectedSubjectKind === 'User' ? t('Users') : t('Groups')}</Title>
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
