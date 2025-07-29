/* Copyright Contributors to the Open Cluster Management project */
import { SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData, Section } from '../../components/AcmFormData'
import { LostChangesContext } from '../../components/LostChanges'
import { useTranslation } from '../../lib/acm-i18next'
import { useQuery } from '../../lib/useQuery'
import { validateKubernetesResourceName } from '../../lib/validation'
import { NavigationPath, useBackCancelNavigation } from '../../NavigationPath'
import { IResource, listGroups, listUsers } from '../../resources'
import { AccessControl, RoleBinding } from '../../resources/access-control'
import { createResource, patchResource } from '../../resources/utils'
import { AcmToastContext } from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchCompleteLazyQuery, useSearchResultItemsQuery } from '../Search/search-sdk/search-sdk'
import { buildAccessControlFromState, getRoleBindingNames } from './AccessControlManagementFormHelper'
import { AccessControlStatus } from './AccessControlStatus'
import { useRoleBinding } from './RoleBindingHook'
import { RoleBindingSection } from './RoleBindingSection'
import schema from './schema.json'
import { useLocalHubName } from '../../hooks/use-local-hub'

const AccessControlManagementForm = ({
  isEditing,
  isViewing,
  handleModalToggle,
  hideYaml,
  accessControl,
  isCreatable,
}: {
  isEditing: boolean
  isViewing: boolean
  isCreatable: boolean
  handleModalToggle?: () => void
  hideYaml?: boolean
  accessControl?: AccessControl
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { back, cancel } = useBackCancelNavigation()
  const toastContext = useContext(AcmToastContext)

  // Data
  const managedClusters = useAllClusters(true)

  const CLUSTER_ROLES_LABEL = 'rbac.open-cluster-management.io/filter=vm-clusterroles'

  const localHubName = useLocalHubName()

  const { data: clusterRolesQuery } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['ClusterRole'] },
            { property: 'cluster', values: [localHubName] },
            { property: 'label', values: [CLUSTER_ROLES_LABEL] },
          ],
          limit: -1,
        },
      ],
    },
  })

  const clusterRoles = clusterRolesQuery?.searchResult?.flatMap((roles) => roles?.items) ?? []

  const { data: users, startPolling: usersStartPolling, stopPolling: usersStopPolling } = useQuery(listUsers)
  const { data: groups, startPolling: groupsStartPolling, stopPolling: groupsStopPolling } = useQuery(listGroups)

  useEffect(() => {
    usersStartPolling()
    groupsStartPolling()
    return () => {
      usersStopPolling()
      groupsStopPolling()
    }
  }, [groupsStartPolling, groupsStopPolling, usersStartPolling, usersStopPolling])

  // General ClusterPermission states
  const [namespace, setNamespace] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [name, setName] = useState('')
  const [rbName, setRbName] = useState<string[]>([])

  // RoleBinding states
  const {
    roleBinding: roleBindingRB,
    isValid: isRBValid,
    setNamespaces: setNamespacesRB,
    setSubjectKind: setSubjectKindRB,
    setSubjectNames: setSubjectNamesRB,
    setRoleNames: setRoleNamesRB,
    onRoleBindingChange: onRoleBindingChangeRB,
  } = useRoleBinding()

  // ClusterRoleBinding states
  const {
    roleBinding: roleBindingCRB,
    isValid: isCRBValid,
    setSubjectKind: setSubjectKindCRB,
    setSubjectNames: setSubjectNamesCRB,
    setRoleNames: setRoleNamesCRB,
    onRoleBindingChange: onRoleBindingChangeCRB,
  } = useRoleBinding()

  const { submitForm } = useContext(LostChangesContext)

  useEffect(() => {
    setName(accessControl?.metadata?.name ?? '')
    setNamespace(accessControl?.metadata?.namespace ?? '')
    setCreatedDate(accessControl?.metadata?.creationTimestamp ?? '')
    setRbName(getRoleBindingNames(accessControl))
  }, [accessControl, accessControl?.metadata, accessControl?.spec.roleBindings])

  useEffect(() => {
    const roleBindings = accessControl?.spec.roleBindings
    if (roleBindings) {
      onRoleBindingChangeRB(roleBindings)
    }
  }, [accessControl?.spec.roleBindings, onRoleBindingChangeRB])

  useEffect(() => {
    const clusterRoleBinding = accessControl?.spec.clusterRoleBinding
    if (clusterRoleBinding) {
      onRoleBindingChangeCRB(clusterRoleBinding)
    }
  }, [accessControl?.spec.clusterRoleBinding, onRoleBindingChangeCRB])

  const [getSearchResults, { data }] = useSearchCompleteLazyQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })
  useEffect(() => {
    getSearchResults({
      client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
      variables: {
        property: 'namespace',
        query: {
          keywords: [],
          filters: [
            {
              property: 'cluster',
              values: [namespace],
            },
          ],
        },
        limit: -1,
      },
    })
  }, [getSearchResults, namespace])

  const namespaceItems: string[] = useMemo(
    () => data?.searchComplete?.filter((e) => e !== null) ?? [],
    [data?.searchComplete]
  )

  const { cancelForm } = useContext(LostChangesContext)
  const guardedHandleModalToggle = useCallback(() => cancelForm(handleModalToggle), [cancelForm, handleModalToggle])

  const stateToData = () => {
    return buildAccessControlFromState(isRBValid, isCRBValid, roleBindingRB, roleBindingCRB, name, namespace, rbName)
  }

  const stateToSyncs = () => {
    const pathPrefix = accessControl?.kind ?? 'ClusterPermission'
    const syncs = [
      {
        path: `${pathPrefix}[0].metadata.namespace`,
        setState: setNamespace,
      },
      {
        path: `${pathPrefix}[0].metadata.name`,
        setState: setName,
      },
      {
        path: `${pathPrefix}[0].spec.roleBindings`,
        setState: (value: unknown) => {
          const rbs = Array.isArray(value) ? (value as RoleBinding[]) : []
          onRoleBindingChangeRB(rbs)
        },
      },
      {
        path: `${pathPrefix}[0].spec.clusterRoleBinding`,
        setState: (value: unknown) => {
          const crb = value as AccessControl['spec']['clusterRoleBinding']
          if (crb) {
            onRoleBindingChangeCRB(crb)
          }
        },
      },
    ]
    return syncs
  }

  const getTitle = () => {
    if (isViewing) {
      return accessControl?.metadata?.name!
    }
    if (isEditing) {
      return t('Edit access control')
    }
    return t('Create permission')
  }

  const title = getTitle()
  const breadcrumbs = [{ text: t('Access control'), to: NavigationPath.accessControlManagement }, { text: title }]

  const clusters = managedClusters.map((c) => ({
    id: c.name,
    value: c.name,
  }))

  const formData: FormData = {
    title,
    description: t('accessControlForm.description'),
    breadcrumb: breadcrumbs,
    sections: [
      {
        type: 'Section',
        title: t('Basic information'),
        wizardTitle: t('Basic information'),
        description: t('accessControlForm.description'),
        inputs: [
          {
            id: 'id',
            type: 'Custom',
            isHidden: !isViewing,
            label: t('ID'),
            component: <span>{accessControl?.metadata?.uid}</span>,
          },
          {
            id: 'cluster',
            type: 'Select',
            label: t('Cluster'),
            placeholder: 'Select or enter cluster name',
            value: namespace,
            onChange: (value: SetStateAction<string>) => {
              setNamespace(value)
            },
            options: clusters,
          },
          {
            id: 'name',
            type: 'Text',
            label: 'Name',
            placeholder: 'Enter access control name',
            value: name,
            onChange: setName,
            validation: (value: string) => validateKubernetesResourceName(value, undefined, t),
          },
          {
            id: 'status',
            type: 'Custom',
            label: t('Status'),
            isHidden: isCreatable || isEditing,
            component: <AccessControlStatus condition={accessControl?.status?.conditions?.[0]} />,
          },
          {
            id: 'date',
            type: 'Text',
            label: t('Created at'),
            value: createdDate,
            onChange: setCreatedDate,
            isDisabled: false,
            isHidden: isCreatable || isEditing,
          },
        ],
      },
      RoleBindingSection({
        title: t('Role bindings'),
        description: t('accessControlForm.roleBindings.description'),
        clusterRoles,
        idPrefix: 'rb',
        isViewing,
        isRolesDisabled: isEditing && roleBindingRB.wasPreFilled,
        isRequired: false,
        selectedNamespaces: roleBindingRB.namespaces,
        selectedSubjectNames: roleBindingRB.subjectNames,
        selectedRoles: roleBindingRB.roleNames,
        selectedSubjectKind: roleBindingRB.subjectKind,
        namespaceOptions: namespaceItems.map((namespace) => ({
          id: namespace,
          value: namespace,
          text: namespace,
        })),
        subjectOptions: Array.from(
          new Map(
            [
              ...((roleBindingRB.subjectKind === 'Group' ? groups : users) || []).map((val) => ({
                id: val.metadata.name!,
                value: val.metadata.name!,
              })),
              ...roleBindingRB.subjectNames.map((name) => ({ id: name, value: name })),
            ].map((item) => [item.value, item])
          ).values()
        ),
        onNamespaceChange: setNamespacesRB,
        onSubjectKindChange: setSubjectKindRB,
        onSubjectNameChange: setSubjectNamesRB,
        onRoleChange: setRoleNamesRB,
      }),

      RoleBindingSection({
        title: t('Cluster role binding'),
        description: t('accessControlForm.clusterRoleBinding.description'),
        clusterRoles,
        idPrefix: 'crb',
        isViewing,
        isRolesDisabled: isEditing && roleBindingCRB.wasPreFilled,
        isRequired: false,
        selectedNamespaces: ['All Namespaces'],
        selectedSubjectNames: roleBindingCRB.subjectNames,
        selectedRoles: roleBindingCRB.roleNames,
        selectedSubjectKind: roleBindingCRB.subjectKind,
        namespaceHelperText: t('accessControlForm.clusterRoleBinding.namespace.helperText'),
        namespaceOptions: [{ id: 'all', value: 'All Namespaces', text: 'All Namespaces', isDisabled: true }],
        subjectOptions: Array.from(
          new Map(
            [
              ...((roleBindingCRB.subjectKind === 'Group' ? groups : users) || []).map((val) => ({
                id: val.metadata.name!,
                value: val.metadata.name!,
              })),
              ...roleBindingCRB.subjectNames.map((name) => ({ id: name, value: name })),
            ].map((item) => [item.value, item])
          ).values()
        ),
        onNamespaceChange: () => {},
        onSubjectKindChange: setSubjectKindCRB,
        onSubjectNameChange: setSubjectNamesCRB,
        onRoleChange: setRoleNamesCRB,
      }),
    ].filter(Boolean) as Section[],

    submit: () => {
      if (!isRBValid && !isCRBValid) {
        toastContext.addAlert({
          title: t('Validation error'),
          message: t('You must define at least one role binding or cluster role binding.'),
          type: 'danger',
          autoClose: true,
        })
        return
      }
      let accessControlData = formData?.customData ?? stateToData()
      if (Array.isArray(accessControlData)) {
        accessControlData = accessControlData[0]
      }
      if (isEditing) {
        const accessControl = accessControlData as AccessControl
        const patch: { op: 'replace'; path: string; value: unknown }[] = []
        const metadata: AccessControl['metadata'] = accessControl.metadata
        patch.push({ op: 'replace', path: `/spec/roleBindings`, value: accessControl.spec.roleBindings })
        patch.push({ op: 'replace', path: `/spec/clusterRoleBinding`, value: accessControl.spec.clusterRoleBinding })
        patchResource(accessControl, patch).promise.then(() => {
          toastContext.addAlert({
            title: t('Acccess Control updated'),
            message: t('accessControlForm.updated.message', { id: metadata?.uid }),
            type: 'success',
            autoClose: true,
          })
          submitForm()
          navigate(NavigationPath.accessControlManagement)
        })
      } else {
        createResource(accessControlData as IResource).promise.then(() => {
          toastContext.addAlert({
            title: t('Permission created'),
            message: t('accessControlForm.created.message'),
            type: 'success',
            autoClose: true,
          })
          submitForm()

          if (handleModalToggle) {
            handleModalToggle()
          } else {
            navigate(NavigationPath.accessControlManagement)
          }
        })
      }
    },
    submitText: isEditing ? t('Save') : t('Create permission'),
    submittingText: isEditing ? t('Saving') : t('Creating'),
    reviewTitle: t('Review your selections'),
    reviewDescription: t(
      'Confirm your selections before creating the permission. To make any changes, go back to the step you want to edit.'
    ),
    cancelLabel: t('Cancel'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    back: handleModalToggle ? guardedHandleModalToggle : back(NavigationPath.accessControlManagement),
    cancel: handleModalToggle ? guardedHandleModalToggle : cancel(NavigationPath.accessControlManagement),
    stateToSyncs,
    stateToData,
  }

  const getFormMode = () => {
    if (isViewing) return 'details'
    if (isEditing) return 'form'
    return 'wizard'
  }

  return (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Access Control YAML')}
      schema={schema}
      mode={getFormMode()}
      hideYaml={hideYaml}
      secrets={[]}
      immutables={isEditing ? ['*.metadata.name', '*.metadata.namespace', '*.data.id', '*.data.creationTimestamp'] : []}
      edit={() =>
        navigate(
          generatePath(NavigationPath.editAccessControlManagement, {
            id: accessControl?.metadata?.uid!,
          })
        )
      }
      isModalWizard={!!handleModalToggle}
    />
  )
}

export { AccessControlManagementForm }
