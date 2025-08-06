import { useContext, useState } from 'react'
import { AcmDataFormPage, AcmDataFormProps } from '../../../components/AcmDataForm'
import { FormData, Section } from '../../../components/AcmFormData'
import { useTranslation } from '../../../lib/acm-i18next'
import { emptyRoleAssignment, RoleAssignment } from '../../../resources/role-assignment'
import { AcmToastContext } from '../../../ui-components'
import schema from './schema.json'

type RoleAssignmentFormDataType = {
  subject: {
    kind: 'user' | 'group' | 'serviceAccount'
    users: string[]
    groups: string[]
    serviceAccounts: string[]
  }
}
type RoleAssignmentFormProps = {
  isViewing?: boolean
  isEditing?: boolean
  hideYaml?: boolean
}
const RoleAssignmentForm = ({ isEditing, isViewing, hideYaml }: RoleAssignmentFormProps) => {
  const { t } = useTranslation()
  // const navigate = useNavigate()
  // const { back, cancel } = useBackCancelNavigation()
  const toastContext = useContext(AcmToastContext)

  // const { submitForm, cancelForm } = useContext(LostChangesContext)

  // const guardedHandleModalToggle = useCallback(() => cancelForm(handleModalToggle), [cancelForm, handleModalToggle])

  const stateToData = (): RoleAssignment => {
    return emptyRoleAssignment
  }

  // TODO: to implement
  const stateToSyncs = (): { path: string; setState: (value: any) => void }[] => {
    const syncs: { path: string; setState: (value: any) => void }[] = []
    return syncs
  }

  const [roleAssignmentData, setRoleAssignmentData] = useState<RoleAssignmentFormDataType>({
    subject: { kind: 'user', users: [], groups: [], serviceAccounts: [] },
  })
  const [isValid] = useState<boolean>(true)

  const title = isEditing ? t('Edit role assignment') : t('Create role assignment')
  const formData: FormData = {
    title,
    sections: [
      {
        type: 'Section',
        inputs: [
          {
            id: `subject-kind`,
            type: 'Radio',
            variant: 'toggleGroup',
            title: t('Select subject'),
            value: roleAssignmentData.subject.kind,
            onChange: (value: string) =>
              setRoleAssignmentData({
                ...roleAssignmentData,
                subject: {
                  ...roleAssignmentData.subject,
                  kind: value as RoleAssignmentFormDataType['subject']['kind'],
                },
              }),
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
            value: roleAssignmentData.subject.users,
            onChange: (users: string[]) =>
              setRoleAssignmentData({
                ...roleAssignmentData,
                subject: {
                  ...roleAssignmentData.subject,
                  users,
                },
              }),
            options: [
              { id: 'juan', value: 'juan' },
              { id: 'pepe', value: 'pepe' },
              { id: 'jose', value: 'jose' },
            ],
            isRequired: roleAssignmentData.subject.kind === 'user',
            isHidden: roleAssignmentData.subject.kind !== 'user',
            isCreatable: true,
          },
          {
            id: `groups`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter groups'),
            value: roleAssignmentData.subject.groups,
            onChange: (groups: string[]) =>
              setRoleAssignmentData({
                ...roleAssignmentData,
                subject: {
                  ...roleAssignmentData.subject,
                  groups,
                },
              }),
            options: [
              { id: 'group1', value: 'group1' },
              { id: 'group2', value: 'group2' },
              { id: 'group3', value: 'group3' },
            ],
            isRequired: roleAssignmentData.subject.kind === 'group',
            isHidden: roleAssignmentData.subject.kind !== 'group',
            isCreatable: true,
          },
          {
            id: `serviceAcctouns`,
            type: 'CreatableMultiselect',
            placeholder: t('Select or enter service accounts'),
            value: roleAssignmentData.subject.serviceAccounts,
            onChange: (serviceAccounts: string[]) =>
              setRoleAssignmentData({
                ...roleAssignmentData,
                subject: {
                  ...roleAssignmentData.subject,
                  serviceAccounts,
                },
              }),
            options: [
              { id: 'serviceAccount1', value: 'serviceAccount1' },
              { id: 'serviceAccount2', value: 'serviceAccount2' },
              { id: 'serviceAccount3', value: 'serviceAccount3' },
            ],
            isRequired: roleAssignmentData.subject.kind === 'serviceAccount',
            isHidden: roleAssignmentData.subject.kind !== 'serviceAccount',
            isCreatable: true,
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
    },
    submitText: isEditing ? t('Save') : t('Create Role assignment'),
    submittingText: isEditing ? t('Saving') : t('Creating'),
    reviewTitle: t('Review your selections'),
    reviewDescription: t(
      'Confirm your selections before creating the role assignment. To make any changes, go back to the step you want to edit.'
    ),
    cancelLabel: t('Cancel'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    // TODO: to implement either back and cancel
    back: () => {},
    cancel: () => {},
    // back: handleModalToggle ? guardedHandleModalToggle : back(NavigationPath.accessControlManagement),
    // cancel: handleModalToggle ? guardedHandleModalToggle : cancel(NavigationPath.accessControlManagement),
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

  return roleAssignmentData ? (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Access Control YAML')}
      schema={schema}
      mode={getFormMode()}
      hideYaml={hideYaml}
      secrets={[]}
      immutables={isEditing ? ['*.metadata.name', '*.metadata.namespace', '*.data.id', '*.data.creationTimestamp'] : []}
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
