/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom-v5-compat'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { LostChangesContext } from '../../components/LostChanges'
import { useTranslation } from '../../lib/acm-i18next'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath, useBackCancelNavigation } from '../../NavigationPath'
import { IResource, listGroups, listUsers } from '../../resources'
import { AccessControl, AccessControlApiVersion, RoleBinding } from '../../resources/access-control'
import { createResource, patchResource } from '../../resources/utils'
import { AcmToastContext } from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchCompleteLazyQuery, useSearchResultItemsQuery } from '../Search/search-sdk/search-sdk'
import { RoleBindingHook } from './RoleBindingHook'
import { RoleBindingSection } from './RoleBindingSection'
import schema from './schema.json'
import { validateKubernetesResourceName } from '../../lib/validation'
import { AccessControlStatus } from './AccessControlStatus'

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
        ...new Set(accessControl.spec.roleBindings.filter((e) => e.subject).map((rb) => rb.subject!.name)),
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
      setSelectedSubjectNamesCRB([accessControl.spec.clusterRoleBinding.subject?.name ?? ''])
      setSelectedRoleNameCRB(accessControl.spec.clusterRoleBinding.roleRef?.name ?? '')
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

  const stateToData = () => {
    const roleBindings = selectedNamespacesRB.flatMap((ns) =>
      selectedSubjectNamesRB.flatMap((user) =>
        selectedRoleNamesRB.map((role) => ({
          namespace: ns,
          roleRef: {
            name: role,
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'ClusterRole',
          },
          subject: {
            name: user,
            apiGroup: 'rbac.authorization.k8s.io',
            kind: selectedSubjectTypeRB,
          },
        }))
      )
    )

    const spec: any = {
      roleBindings,
    }

    if (selectedSubjectNamesCRB.length && selectedRoleNameCRB) {
      spec.clusterRoleBinding = {
        ...(accessControl?.spec.clusterRoleBinding?.name && {
          name: accessControl.spec.clusterRoleBinding.name,
        }),
        roleRef: {
          name: selectedRoleNameCRB,
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
        },
        subject: {
          name: selectedSubjectNamesCRB[0],
          apiGroup: 'rbac.authorization.k8s.io',
          kind: selectedSubjectTypeCRB,
        },
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

  const title = isViewing
    ? accessControl?.metadata?.name!
    : isEditing
      ? t('Edit access control')
      : t('Add access control')
  const breadcrumbs = [{ text: t('Access Controls'), to: NavigationPath.accessControlManagement }, { text: title }]

  const clusters = managedClusters.map((c) => ({
    id: c.name,
    value: c.name,
  }))

  const formData: FormData = {
    title,
    description: t('An access control stores the... TO BE DEFINED'),
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
            onChange: (value) => {
              setNamespace(value)
            },
            options: clusters,
            isRequired: true,
          },
          {
            id: 'name',
            type: 'Text',
            label: 'Name',
            placeholder: 'Enter access control name',
            value: name,
            onChange: setName,
            isRequired: true,
            validation: (value) => validateKubernetesResourceName(value, undefined, t),
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
            isRequired: true,
            isDisabled: false,
            isHidden: isCreatable || isEditing,
          },
        ],
      },
      RoleBindingSection({
        title: 'Role Bindings',
        clusterRoles,
        idPrefix: 'rb',
        isViewing,
        isRequired: !selectedRoleNameCRB && !selectedSubjectNamesCRB.length,
        selectedNamespaces: selectedNamespacesRB,
        selectedSubjectNames: selectedSubjectNamesRB,
        selectedRoles: selectedRoleNamesRB,
        selectedSubjectType: selectedSubjectTypeRB,
        namespaceOptions: namespaceItems.map((namespace) => ({
          id: namespace,
          value: namespace,
          text: namespace,
        })),
        subjectOptions: ((selectedSubjectTypeRB === 'Group' ? groups : users) || []).map((val) => ({
          id: val.metadata.uid!,
          value: val.metadata.name!,
        })),
        onNamespaceChange: onNamespaceChangeRB,
        onSubjectTypeChange: onSubjectTypeChangeRB,
        onSubjectNameChange: onSubjectNameChangeRB,
        onRoleChange: onRoleChangeRB,
      }),

      RoleBindingSection({
        title: 'Cluster Role Binding',
        clusterRoles,
        idPrefix: 'crb',
        isViewing,
        isRequired: !selectedSubjectNamesRB.length && !selectedRoleNamesRB.length,
        selectedNamespaces: ['All Namespaces'],
        selectedSubjectNames: selectedSubjectNamesCRB,
        selectedRoles: selectedRoleNameCRB ? [selectedRoleNameCRB] : [],
        selectedSubjectType: selectedSubjectTypeCRB,
        namespaceOptions: [{ id: 'all', value: 'All Namespaces', text: 'All Namespaces', isDisabled: true }],
        subjectOptions: ((selectedSubjectTypeCRB === 'Group' ? groups : users) || []).map((val) => ({
          id: val.metadata.uid!,
          value: val.metadata.name!,
        })),
        onNamespaceChange: () => {},
        onSubjectTypeChange: onSubjectTypeChangeCRB,
        onSubjectNameChange: onSubjectNameChangeCRB,
        onRoleChange: onRoleChangeCRB,
      }),
    ],

    submit: () => {
      let accessControlData = formData?.customData ?? stateToData()
      if (Array.isArray(accessControlData)) {
        accessControlData = accessControlData[0]
      }
      if (isEditing) {
        const accessControl = accessControlData as AccessControl
        const patch: { op: 'replace'; path: string; value: unknown }[] = []
        const metadata: AccessControl['metadata'] = accessControl.metadata!
        patch.push({ op: 'replace', path: `/spec/roleBindings`, value: accessControl.spec.roleBindings })
        return patchResource(accessControl, patch).promise.then(() => {
          toastContext.addAlert({
            title: t('Acccess Control updated'),
            message: t('accessControlForm.updated.message', { id: metadata.uid }),
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

  return (
    <AcmDataFormPage
      formData={formData}
      editorTitle={t('Access Control YAML')}
      schema={schema}
      mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'}
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
