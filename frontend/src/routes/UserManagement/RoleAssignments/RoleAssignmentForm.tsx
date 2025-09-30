/* Copyright Contributors to the Open Cluster Management project */
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
import { ClustersDualListSelector } from '../RoleAssignment/ClustersDualListSelector'
import { NamespaceSelector } from '../RoleAssignment/NamespaceSelector'
import { useRoleAssignmentData } from './hook/RoleAssignmentDataHook'
import { RoleAssignmentFormDataType, useRoleAssignmentFormData } from './hook/RoleAssignmentFormDataHook'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'
import schema from './schema.json'
import { LoadingState } from '@openshift-assisted/ui-lib/common'
import { Checkbox } from '@patternfly/react-core'

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
    onChangeScopeNamespaces,
    onChangeRoles,
  } = useRoleAssignmentFormData(preselected, roleAssignmentData)

  const onChoseOptions = useCallback(
    (values: { id: string; value: string }[]) => {
      onChangeScopeValues(values.map((e) => e.value))
    },
    [onChangeScopeValues]
  )

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

    if (preselected?.subject?.value !== undefined && preselected?.subject?.kind !== undefined) {
      secondPart = ` ${t('for')} ${preselected.subject.value} ${preselected.subject.kind === UserKind ? t('user') : t('group')}`
    } else if (preselected?.roles && preselected.roles.length > 0) {
      secondPart = ` ${treatRoleAssignmentEntityTitle(preselected.roles, t('roles'), t('role'))}`
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
              { id: `user`, value: UserKind, text: t('User') },
              { id: `group`, value: GroupKind, text: t('Group') },
            ],
            isRequired: true,
            isHidden: isSubjectFieldHidden,
          },
          {
            id: `users`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter user names'),
            value: roleAssignmentFormData.subject.user || [],
            onChange: onChangeUserValue,
            options: roleAssignmentData.users,
            isRequired: roleAssignmentFormData.subject.kind === UserKind,
            isHidden:
              (preselected?.subject?.kind
                ? preselected.subject.kind !== UserKind
                : roleAssignmentFormData.subject.kind !== UserKind) || isSubjectFieldHidden,
            isLoading: isUsersLoading,
            isScrollable: true,
            validation: (user?: string[]) => (user && user.length > 0 ? undefined : t('a user should be selected')),
          },
          {
            id: `groups`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter groups'),
            value: roleAssignmentFormData.subject.group || [],
            onChange: onChangeGroupValue,
            options: roleAssignmentData.groups,
            isRequired: roleAssignmentFormData.subject.kind === GroupKind,
            isHidden:
              (preselected?.subject?.kind
                ? preselected.subject.kind !== GroupKind
                : roleAssignmentFormData.subject.kind !== GroupKind) || isSubjectFieldHidden,
            isLoading: isGroupsLoading,
            isScrollable: true,
            validation: (group?: string[]) => (group && group.length > 0 ? undefined : t('a group should be selected')),
          },
        ],
      },
      // TODO: allow users to choose multiple roles
      {
        type: 'Section',
        wizardTitle: t('Roles'),
        inputs: [
          {
            id: `roles`,
            type: 'Select',
            title: t('Select role'),
            placeholder: t('Select a role'),
            value: roleAssignmentFormData.roles?.[0] || '',
            onChange: (role: string) => onChangeRoles(role ? [role] : []),
            options: roleAssignmentData.roles,
            isLoading: isRolesLoading,
            isScrollable: true,
            isRequired: preselected?.roles === undefined || preselected?.roles?.length === 0,
            isHidden: preselected?.roles?.length,
            validation: (role: string) => (role ? undefined : t('a role should be selected')),
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
              { id: `all`, value: 'all', text: t('Global role (all clusters and namespaces)') },
              { id: `specific`, value: 'specific', text: t('Select specific') },
            ],
            isRequired: preselected?.cluterSets === undefined || preselected?.cluterSets?.length === 0,
            isHidden: preselected?.cluterSets?.length,
          },
          {
            id: `clusters`,
            type: 'Custom',
            isInline: false,
            value: roleAssignmentFormData.scope.clusterNames,
            onChange: onChangeScopeValues,
            component: isClusterSetLoading ? (
              <LoadingState />
            ) : (
              <ClustersDualListSelector onChoseOptions={onChoseOptions} clusterSets={roleAssignmentData.clusterSets} />
            ),
            isRequired: preselected?.cluterSets === undefined || preselected?.cluterSets?.length === 0,
            isHidden: roleAssignmentFormData.scope.kind === 'all',
            validation: (clusters: string[]) =>
              clusters?.length > 0 ? undefined : t('at least one cluster should be selected'),
          },
          {
            id: `namespaces`,
            type: 'Custom',
            isInline: false,
            value: roleAssignmentFormData.scope.namespaces,
            onChange: onChangeScopeNamespaces,
            component: (() => {
              const isAllNamespaces = roleAssignmentFormData.scope.namespaces === null
              return (
                <div>
                  <Checkbox
                    id="crb"
                    label="All namespaces"
                    isChecked={isAllNamespaces}
                    onChange={(_event, checked) => {
                      if (checked) {
                        onChangeScopeNamespaces(null as any)
                      } else {
                        onChangeScopeNamespaces(undefined)
                      }
                    }}
                  />
                  <div style={{ marginTop: 'var(--pf-v5-global--spacer--sm)' }}>
                    <NamespaceSelector
                      selectedClusters={roleAssignmentFormData.scope.clusterNames || []}
                      clusters={roleAssignmentData.clusterSets?.flatMap((cs) => cs.clusters || []) || []}
                      onChangeNamespaces={onChangeScopeNamespaces}
                      selectedNamespaces={roleAssignmentFormData.scope.namespaces}
                      disabled={isAllNamespaces}
                    />
                  </div>
                </div>
              )
            })(),
            isRequired: false,
            isHidden: (() => {
              const allScopeHidden = roleAssignmentFormData.scope.kind === 'all'
              const noClustersHidden = !roleAssignmentFormData.scope.clusterNames?.length
              return allScopeHidden || noClustersHidden
            })(),
            validation: (namespaces: string[] | null | undefined) => {
              if (
                Array.isArray(namespaces) &&
                namespaces.length > 0 &&
                (!roleAssignmentFormData.scope.clusterNames || roleAssignmentFormData.scope.clusterNames.length === 0)
              ) {
                return t('Clusters must be selected before selecting namespaces')
              }
              return undefined
            },
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
    if (isViewing) {
      return 'details'
    }
    return 'form'
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
