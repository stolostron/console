import { useCallback, useEffect, useState } from 'react'
import { AcmDataFormPage, AcmDataFormProps } from '../../../components/AcmDataForm'
import { FormData, Section } from '../../../components/AcmFormData'
import { useTranslation } from '../../../lib/acm-i18next'
import { GroupKind, UserKind } from '../../../resources'
import {
  emptyMulticlusterRoleAssignment,
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentKind,
} from '../../../resources/multicluster-role-assignment'
import { truncateMiddle } from '../../Applications/ApplicationDetails/ApplicationTopology/topology/components/future/truncate-middle'
import { ClustersDualListSelector } from './ClustersDualListSelector'
import { useRoleAssignmentData } from './hook/RoleAssignmentDataHook'
import { RoleAssignmentFormDataType, useRoleAssignmentFormData } from './hook/RoleAssignmentFormDataHook'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import schema from './schema.json'
import { LoadingState } from '@openshift-assisted/ui-lib/common'

type RoleAssignmentFormProps = {
  onCancel: () => void
  onSubmit: (data: RoleAssignmentFormDataType) => void
  isViewing?: boolean
  isEditing?: boolean
  hideYaml?: boolean
  preselected?: RoleAssignmentPreselected
}
const RoleAssignmentForm = ({
  onCancel,
  onSubmit,
  isEditing,
  isViewing,
  hideYaml,
  preselected,
}: RoleAssignmentFormProps) => {
  const { t } = useTranslation()

  const {
    roleAssignmentData,
    isLoading: isRoleAssignmentDataLoading,
    isUsersLoading,
    isGroupsLoading,
    isRolesLoading,
    isClusterSetLoading,
  } = useRoleAssignmentData()

  const {
    roleAssignmentFormData,
    onChangeSubjectKind,
    onChangeUserValue,
    onChangeGroupValue,
    onChangeScopeKind,
    onChangeScopeValues,
    onChangeRoles,
  } = useRoleAssignmentFormData(preselected)

  // TODO: to implement once YAML is needed
  const stateToData = (): MulticlusterRoleAssignment => {
    return emptyMulticlusterRoleAssignment
  }

  // TODO: to implement once YAML is needed
  const stateToSyncs = (): { path: string; setState: (value: any) => void }[] => {
    const pathPrefix = MulticlusterRoleAssignmentKind

    const syncs: { path: string; setState: (value: any) => void }[] = [
      {
        path: `${pathPrefix}[0].spec.roles`,
        setState: (values: any) => onChangeRoles(values),
      },
    ]
    return syncs
  }

  const [title, setTitle] = useState<string>('')

  const treatRoleAssignmentEntityTitle = useCallback(
    (entities: string[], entityPlural: string, entitySingular: string) => {
      const entityNames = truncateMiddle(entities.join(', '), { length: 20 })
      const pluralSingular = entities.length > 1 ? entityPlural : entitySingular
      return `${t('for')} ${entityNames} ${pluralSingular}`
    },
    [t]
  )

  useEffect(() => {
    const firstPart = isEditing ? t('Edit role assignment') : t('Create role assignment')
    let secondPart = ''

    switch (true) {
      case preselected?.subject && preselected.subject.value !== undefined && preselected.subject.kind !== undefined:
        secondPart = ` ${t('for')} ${preselected.subject.value} ${preselected.subject.kind === UserKind ? t('user') : t('group')}`
        break
      case preselected?.roles && preselected?.roles.length > 0:
        secondPart = ` ${treatRoleAssignmentEntityTitle(preselected.roles, t('roles'), t('role'))}`
        break
      default:
        secondPart = ''
    }
    setTitle(`${firstPart}${secondPart}`)
  }, [isEditing, preselected, t, treatRoleAssignmentEntityTitle])

  const isSubjectFieldHidden = isViewing || preselected?.subject?.value !== undefined

  const formData: FormData = {
    title,
    sections: [
      {
        type: 'Section',
        wizardTitle: t('Subject'),
        inputs: [
          {
            id: `subject-kind`,
            type: 'Radio',
            variant: 'toggleGroup',
            title: t('Select subject'),
            value: roleAssignmentFormData.subject.kind,
            onChange: onChangeSubjectKind,
            options: [
              { id: `user`, value: 'user', text: t('User') },
              { id: `group`, value: 'group', text: t('Group') },
            ],
            isRequired: true,
            isHidden: isSubjectFieldHidden,
          },
          {
            id: `users`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter user names'),
            value: roleAssignmentFormData.subject.user,
            onChange: onChangeUserValue,
            options: roleAssignmentData.users,
            isRequired: roleAssignmentFormData.subject.kind === UserKind,
            isHidden:
              roleAssignmentFormData.subject.kind !== UserKind ||
              preselected?.subject?.kind !== UserKind ||
              isSubjectFieldHidden,
            isLoading: isUsersLoading,
            isScrollable: true,
            validation: (user?: string) => (user !== undefined ? undefined : t('a user should be selected')),
          },
          {
            id: `groups`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter groups'),
            value: roleAssignmentFormData.subject.group,
            onChange: onChangeGroupValue,
            options: roleAssignmentData.groups,
            isRequired: roleAssignmentFormData.subject.kind === GroupKind,
            isHidden:
              roleAssignmentFormData.subject.kind !== GroupKind ||
              preselected?.subject?.kind !== GroupKind ||
              isSubjectFieldHidden,
            isLoading: isGroupsLoading,
            isScrollable: true,
            validation: (group?: string) => (group !== undefined ? undefined : t('a group should be selected')),
          },
        ],
      },
      {
        type: 'Section',
        wizardTitle: t('Roles'),
        inputs: [
          {
            id: `roles`,
            type: 'CreatableMultiselect',
            title: t('Select roles'),
            placeholder: t('Select or enter roles'),
            value: roleAssignmentFormData.roles,
            onChange: onChangeRoles,
            options: roleAssignmentData.roles,
            isLoading: isRolesLoading,
            isScrollable: true,
            isRequired: preselected?.roles === undefined || preselected?.roles?.length === 0,
            isHidden: preselected?.roles?.length,
            validation: (roles: string[]) =>
              roles?.length > 0 ? undefined : t('at least one role should be selected'),
          },
        ],
      },
      {
        type: 'Section',
        wizardTitle: t('Scope'),
        inputs: [
          {
            id: `scope-kind`,
            type: 'Radio',
            isInline: false,
            title: t('Select scope'),
            value: roleAssignmentFormData.scope.kind,
            onChange: onChangeScopeKind,
            options: [
              { id: `all`, value: 'all', text: t('Propagate to all (everything in this Cluster)') },
              { id: `specific`, value: 'specific', text: t('Select specific') },
            ],
            isRequired: preselected?.cluterSets === undefined || preselected?.cluterSets?.length === 0,
            isHidden: preselected?.cluterSets?.length,
          },
          {
            id: `clusters`,
            type: 'Custom',
            isInline: false,
            value: roleAssignmentFormData.scope.values,
            onChange: onChangeScopeValues,
            component: isClusterSetLoading ? (
              <LoadingState />
            ) : (
              <ClustersDualListSelector
                onChoseOptions={(values: { id: string; value: string }[]) =>
                  onChangeScopeValues(values.map((e) => e.value))
                }
                clusterSets={roleAssignmentData.clusterSets}
              />
            ),
            isRequired: preselected?.cluterSets === undefined || preselected?.cluterSets?.length === 0,
            isHidden: preselected?.cluterSets?.length || roleAssignmentFormData.scope.kind === 'all',
            validation: (clusters: string[]) =>
              clusters?.length > 0 ? undefined : t('at least one cluster should be selected'),
          },
        ],
      },
    ].filter(Boolean) as Section[],

    submit: () => onSubmit(roleAssignmentFormData),
    submitText: isEditing ? t('Save') : t('Create'),
    submittingText: isEditing ? t('Saving') : t('Creating'),
    reviewTitle: t('Review your selections'),
    reviewDescription: t(
      'Confirm your selections before creating the role assignment. To make any changes, go back to the step you want to edit.'
    ),
    cancelLabel: t('Cancel'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    // TODO: to implement back
    back: () => {},
    cancel: onCancel,
    stateToSyncs,
    stateToData,
  }

  const getFormMode = (): AcmDataFormProps['mode'] => {
    switch (true) {
      case isViewing:
        return 'details'
      default:
        return 'form'
    }
  }

  const inmutables = ['apiVersion', 'kind']

  return roleAssignmentFormData ? (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Access Control YAML')}
      schema={schema}
      mode={getFormMode()}
      hideYaml={hideYaml}
      secrets={[]}
      immutables={
        isEditing
          ? [...inmutables, '*.metadata.name', '*.metadata.namespace', '*.data.id', '*.data.creationTimestamp']
          : inmutables
      }
      isDisabled={isRoleAssignmentDataLoading}
    />
  ) : null
}

export { RoleAssignmentForm }
