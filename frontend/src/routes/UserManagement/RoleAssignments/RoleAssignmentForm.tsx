import { useContext, useState } from 'react'
import { AcmDataFormPage, AcmDataFormProps } from '../../../components/AcmDataForm'
import { FormData, Section } from '../../../components/AcmFormData'
import { useTranslation } from '../../../lib/acm-i18next'
import { emptyRoleAssignment, RoleAssignment, RoleAssignmentKind } from '../../../resources/role-assignment'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignmentIds } from './model/role-assignment-ids'
import { useRoleAssignmentFormData } from './hook/RoleAssignmentFormDataHook'
import { useRoleAssignment } from './hook/RoleAssignmentHook'
import schema from './schema.json'

type RoleAssignmentFormProps = {
  onCancel: () => void
  onSave?: () => void
  isViewing?: boolean
  isEditing?: boolean
  hideYaml?: boolean
  preselected?: RoleAssignmentIds
}
const RoleAssignmentForm = ({
  onCancel,
  onSave,
  isEditing,
  isViewing,
  hideYaml,
  preselected,
}: RoleAssignmentFormProps) => {
  const { t } = useTranslation()
  // const navigate = useNavigate()
  // const { back, cancel } = useBackCancelNavigation()
  const toastContext = useContext(AcmToastContext)

  const {
    roleAssignment,
    isLoading: isRoleAssignmentLoading,
    isUsersLoading,
    isGroupsLoading,
    isServiceAccountsLoading,
    isRolesLoading,
  } = useRoleAssignment()

  // const { submitForm, cancelForm } = useContext(LostChangesContext)

  // const guardedHandleModalToggle = useCallback(() => cancelForm(handleModalToggle), [cancelForm, handleModalToggle])

  const {
    roleAssignmentFormData,
    onChangeSubjectKind,
    onChangeUsers,
    onChangeGroups,
    onChangeServiceAccounts,
    onChangeScopeKind,
    onChangeRoles,
  } = useRoleAssignmentFormData(preselected)

  const stateToData = (): RoleAssignment => {
    return emptyRoleAssignment
  }

  // TODO: to implement
  const stateToSyncs = (): { path: string; setState: (value: any) => void }[] => {
    const pathPrefix = RoleAssignmentKind

    const syncs: { path: string; setState: (value: any) => void }[] = [
      {
        path: `${pathPrefix}[0].spec.roles`,
        setState: (values: any) => {
          console.log('KIKE stateToSyncs.roles', values)
          onChangeRoles(values)
        },
      },
    ]
    return syncs
  }

  const [isValid] = useState<boolean>(true)

  const title = isEditing ? t('Edit role assignment') : t('Create role assignment')
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
              { id: `serviceAccount`, value: 'serviceAccount', text: t('Service Account') },
            ],
            isRequired: true,
            isHidden: isViewing,
          },
          {
            id: `users`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter user names'),
            value: roleAssignmentFormData.subject.users,
            onChange: onChangeUsers,
            options: roleAssignment.users,
            isRequired: roleAssignmentFormData.subject.kind === 'user',
            isHidden: roleAssignmentFormData.subject.kind !== 'user',
            isCreatable: true,
            isLoading: isUsersLoading,
            isScrollable: true,
          },
          {
            id: `groups`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter groups'),
            value: roleAssignmentFormData.subject.groups,
            onChange: onChangeGroups,
            options: roleAssignment.groups,
            isRequired: roleAssignmentFormData.subject.kind === 'group',
            isHidden: roleAssignmentFormData.subject.kind !== 'group',
            isCreatable: true,
            isLoading: isGroupsLoading,
            isScrollable: true,
          },
          {
            id: `serviceAcctouns`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter service accounts'),
            value: roleAssignmentFormData.subject.serviceAccounts,
            onChange: onChangeServiceAccounts,
            options: roleAssignment.serviceAccounts,
            isRequired: roleAssignmentFormData.subject.kind === 'serviceAccount',
            isHidden: roleAssignmentFormData.subject.kind !== 'serviceAccount',
            isCreatable: true,
            isLoading: isServiceAccountsLoading,
            isScrollable: true,
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
            isRequired: true,
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
            options: roleAssignment.roles,
            isCreatable: true,
            isLoading: isRolesLoading,
            isScrollable: true,
          },
        ],
      },
    ].filter(Boolean) as Section[],

    // TODO: implement submit
    submit: () => {
      if (!isValid) {
        toastContext.addAlert({
          title: t('Validation error'),
          message: t('You must define...'),
          type: 'danger',
          autoClose: true,
        })
        return
      }
      onSave?.()
    },
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
      isDisabled={isRoleAssignmentLoading}
      // edit={() =>
      //   navigate(
      //     generatePath(NavigationPath.editAccessControlManagement, {
      //       id: accessControl?.metadata?.uid!,
      //     })
      //   )
      // }
      // isModalWizard={!!handleModalToggle}
    />
  ) : null
}

export { RoleAssignmentForm }
