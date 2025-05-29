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
import { AccessControl, AccessControlApiVersion, RoleBinding } from '../../resources/access-control'
import { createResource, patchResource } from '../../resources/utils'
import { AcmToastContext } from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchCompleteLazyQuery, useSearchResultItemsQuery } from '../Search/search-sdk/search-sdk'
import { AccessControlStatus } from './AccessControlStatus'
import { RoleBindingHook } from './RoleBindingHook'
import { RoleBindingSection } from './RoleBindingSection'
import schema from './schema.json'

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

  const { data: clusterRolesQuery } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['ClusterRole'] },
            { property: 'cluster', values: ['local-cluster'] },
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

  // RoleBinding states
  const {
    selected: selectedRoleBindings,
    selectedSubjectType: selectedSubjectTypeRB,
    selectedSubjectNames: selectedSubjectNamesRB,
    selectedRoleNames: selectedRoleNamesRB,
    selectedNamespaces: selectedNamespacesRB,
    setSelected: setSelectedRB,
    setSelectedSubjectNames: setSelectedSubjectNamesRB,
    setSelectedRoleNames: setSelectedRoleNamesRB,
    setSelectedNamespaces: setSelectedNamespacesRB,
    onNamespaceChange: onNamespaceChangeRB,
    onSubjectTypeChange: onSubjectTypeChangeRB,
    onSubjectNameChange: onSubjectNameChangeRB,
    onRoleChange: onRoleChangeRB,
  } = RoleBindingHook<RoleBinding>()

  // ClusterRoleBinding states
  const {
    selectedSubjectType: selectedSubjectTypeCRB,
    selectedSubjectNames: selectedSubjectNamesCRB,
    selectedRoleName: selectedRoleNameCRB,
    setSelectedSubjectNames: setSelectedSubjectNamesCRB,
    setSelectedRoleName: setSelectedRoleNameCRB,
    onSubjectTypeChange: onSubjectTypeChangeCRB,
    onSubjectNameChange: onSubjectNameChangeCRB,
    onRoleChange: onRoleChangeCRB,
  } = RoleBindingHook<string>()

  const { submitForm } = useContext(LostChangesContext)

  useEffect(() => {
    setName(accessControl?.metadata?.name ?? '')
    setNamespace(accessControl?.metadata?.namespace ?? '')
    setCreatedDate(accessControl?.metadata?.creationTimestamp ?? '')
  }, [accessControl?.metadata])

  useEffect(() => {
    setSelectedRB((accessControl?.spec?.roleBindings ?? []) as RoleBinding[])
    if (accessControl?.spec?.roleBindings) {
      setSelectedSubjectNamesRB([
        ...new Set(
          accessControl.spec.roleBindings?.flatMap((rb) =>
            rb.subject ? [rb.subject.name] : rb.subjects?.map((s) => s.name) ?? []
          )
        ),
      ])
      setSelectedRoleNamesRB([...new Set(accessControl.spec.roleBindings.map((rb) => rb.roleRef.name))])
      setSelectedNamespacesRB([...new Set(accessControl.spec.roleBindings.map((rb) => rb.namespace))])
    }
  }, [
    accessControl?.spec.roleBindings,
    setSelectedNamespacesRB,
    setSelectedRoleNamesRB,
    setSelectedSubjectNamesRB,
    setSelectedRB,
  ])

  useEffect(() => {
    if (accessControl?.spec?.clusterRoleBinding) {
      const crb = accessControl.spec.clusterRoleBinding
      const names = crb.subjects?.map((s) => s.name) ?? (crb.subject ? [crb.subject.name] : [])
      setSelectedSubjectNamesCRB([...new Set(names)])
      setSelectedRoleNameCRB(crb.roleRef?.name ?? '')
    }
  }, [accessControl?.spec.clusterRoleBinding, setSelectedRoleNameCRB, setSelectedSubjectNamesCRB])

  useEffect(() => {
    if (!isEditing && !isViewing && accessControl?.spec?.roleBindings && !selectedRoleBindings.length) {
      setSelectedRB([])
    }
  }, [accessControl?.spec?.roleBindings, isEditing, isViewing, namespace, selectedRoleBindings.length, setSelectedRB])

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
  const isRBValid = selectedRoleNamesRB.length > 0 && selectedSubjectNamesRB.length > 0
  const isCRBValid = !!selectedRoleNameCRB && selectedSubjectNamesCRB.length > 0

  const stateToData = () => {
    const spec: any = isRBValid
      ? {
          roleBindings: selectedNamespacesRB.flatMap((ns) =>
            selectedRoleNamesRB.map((role) => ({
              namespace: ns,
              roleRef: {
                name: role,
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
              },
              subjects: selectedSubjectNamesRB.map((name) => ({
                name,
                apiGroup: 'rbac.authorization.k8s.io',
                kind: selectedSubjectTypeRB,
              })),
            }))
          ),
        }
      : {}

    if (isCRBValid) {
      spec.clusterRoleBinding = {
        roleRef: {
          name: selectedRoleNameCRB,
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
        },
        subjects: selectedSubjectNamesCRB.map((name) => ({
          name,
          apiGroup: 'rbac.authorization.k8s.io',
          kind: selectedSubjectTypeCRB,
        })),
      }
    }

    return [
      {
        apiVersion: AccessControlApiVersion,
        kind: accessControl ? accessControl?.kind : 'ClusterPermission',
        metadata: {
          name,
          namespace,
        },
        spec,
      },
    ]
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
      // TODO: correct below for role bindings, cluster role bindings, and multiple subjects for both
      // {
      //   path: `${pathPrefix}[0].spec.roleBindings`,
      //   setState: (roleBindings: RoleBinding[]) => {
      //     setSelectedRoleBindings(roleBindings?.length ? roleBindings : [])
      //     setSubjectType(roleBindings?.[0]?.subject?.kind ?? subjectType)
      //   },
      // },
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
    return t('Add access control')
  }

  const title = getTitle()
  const breadcrumbs = [{ text: t('Access Controls'), to: NavigationPath.accessControlManagement }, { text: title }]

  const clusters = managedClusters.map((c) => ({
    id: c.name,
    value: c.name,
  }))

  const formData: FormData = {
    title,
    description: t('Access Control Management using ClusterPermissions'),
    breadcrumb: breadcrumbs,
    sections: [
      {
        type: 'Section',
        title: t('Basic information'),
        wizardTitle: t('Basic information'),
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
        title: t('Role Bindings'),
        clusterRoles,
        idPrefix: 'rb',
        isViewing,
        isRequired: false,
        selectedNamespaces: selectedNamespacesRB,
        selectedSubjectNames: selectedSubjectNamesRB,
        selectedRoles: selectedRoleNamesRB,
        selectedSubjectType: selectedSubjectTypeRB,
        namespaceOptions: namespaceItems.map((namespace) => ({
          id: namespace,
          value: namespace,
          text: namespace,
        })),
        subjectOptions: Array.from(
          new Map(
            [
              ...((selectedSubjectTypeRB === 'Group' ? groups : users) || []).map((val) => ({
                id: val.metadata.uid!,
                value: val.metadata.name!,
              })),
              ...selectedSubjectNamesRB.map((name) => ({ id: name, value: name })),
            ].map((item) => [item.value, item])
          ).values()
        ),
        onNamespaceChange: onNamespaceChangeRB,
        onSubjectTypeChange: onSubjectTypeChangeRB,
        onSubjectNameChange: onSubjectNameChangeRB,
        onRoleChange: onRoleChangeRB,
      }),

      RoleBindingSection({
        title: t('Cluster Role Binding'),
        clusterRoles,
        idPrefix: 'crb',
        isViewing,
        isRequired: false,
        selectedNamespaces: ['All Namespaces'],
        selectedSubjectNames: selectedSubjectNamesCRB,
        selectedRoles: selectedRoleNameCRB ? [selectedRoleNameCRB] : [],
        selectedSubjectType: selectedSubjectTypeCRB,
        namespaceOptions: [{ id: 'all', value: 'All Namespaces', text: 'All Namespaces', isDisabled: true }],
        subjectOptions: Array.from(
          new Map(
            [
              ...((selectedSubjectTypeCRB === 'Group' ? groups : users) || []).map((val) => ({
                id: val.metadata.uid!,
                value: val.metadata.name!,
              })),
              ...selectedSubjectNamesCRB.map((name) => ({ id: name, value: name })),
            ].map((item) => [item.value, item])
          ).values()
        ),
        onNamespaceChange: () => {},
        onSubjectTypeChange: onSubjectTypeChangeCRB,
        onSubjectNameChange: onSubjectNameChangeCRB,
        onRoleChange: onRoleChangeCRB,
      }),
    ].filter(Boolean) as Section[],

    submit: () => {
      if (!isRBValid && !isCRBValid) {
        toastContext.addAlert({
          title: t('Validation error'),
          message: t('You must define at least one Role Binding or Cluster Role Binding.'),
          type: 'danger',
          autoClose: true,
        })
        return Promise.reject()
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
        return patchResource(accessControl, patch).promise.then(() => {
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
        return createResource(accessControlData as IResource).promise.then((resource) => {
          toastContext.addAlert({
            title: t('Access Control created'),
            message: t('accessControlForm.created.message', { id: (resource as AccessControl).metadata?.uid }),
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
    submitText: isEditing ? t('Save') : t('Add'),
    submittingText: isEditing ? t('Saving') : t('Adding'),
    reviewTitle: t('Review your selections'),
    reviewDescription: t('Return to a step to make changes'),
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
