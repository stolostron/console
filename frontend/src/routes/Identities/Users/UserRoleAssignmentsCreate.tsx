/* Copyright Contributors to the Open Cluster Management project */
import { useState, useEffect, useMemo, useContext, useCallback } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmModal, AcmButton, AcmMultiSelect, AcmToastContext } from '../../../ui-components'
import { Form, FormGroup, Radio, Switch } from '@patternfly/react-core'
import { Drawer, DrawerContent, DrawerContentBody, DrawerPanelContent } from '@patternfly/react-core'
import { SelectOption } from '@patternfly/react-core'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { ClusterRole, listClusterRoles, RbacApiVersion, listUsers, ClusterRoleBindingKind } from '../../../resources/rbac'
import { ManagedCluster, ManagedClusterDefinition } from '../../../resources/managed-cluster'
import { Namespace, NamespaceDefinition } from '../../../resources/namespace'
import { useQuery } from '../../../lib/useQuery'
import { listResources } from '../../../resources/utils/resource-request'
import { createResource } from '../../../resources/utils/resource-request'
import { SelectVariant } from '../../../components/AcmSelectBase'

// should be in rbac.ts?
const getManagedClusters = () => listResources<ManagedCluster>(ManagedClusterDefinition)
const listNamespaces = () => listResources<Namespace>(NamespaceDefinition)

// Helper functions for creating role bindings
const createBaseSubject = (userName: string) => ({
  kind: 'User' as const,
  apiGroup: 'rbac.authorization.k8s.io',
  name: userName
})

const createBaseRoleRef = (roleName: string) => ({
  apiGroup: 'rbac.authorization.k8s.io',
  kind: 'ClusterRole' as const,
  name: roleName
})

const createClusterRoleBinding = (roleName: string, userName: string, clusters?: string[]) => ({
  apiVersion: RbacApiVersion,
  kind: ClusterRoleBindingKind,
  metadata: {
    name: `role-assignment-${Date.now()}`,
    ...(clusters && clusters.length > 0 && {
      annotations: {
        'cluster.open-cluster-management.io/clusters': clusters.join(',')
      }
    })
  },
  subjects: [createBaseSubject(userName)],
  roleRef: createBaseRoleRef(roleName)
})

const createRoleBinding = (roleName: string, userName: string, namespace: string, clusters?: string[]) => ({
  apiVersion: RbacApiVersion,
  kind: 'RoleBinding',
  namespace,
  metadata: {
    name: `role-assignment-${Date.now()}`,
    namespace,
    ...(clusters && clusters.length > 0 && {
      annotations: {
        'cluster.open-cluster-management.io/clusters': clusters.join(',')
      }
    })
  },
  subjects: [createBaseSubject(userName)],
  roleRef: createBaseRoleRef(roleName)
})

// YAML preview helpers with custom names
const createYamlClusterRoleBinding = (roleName: string, userName: string, clusters?: string[]) => ({
  apiVersion: RbacApiVersion,
  kind: 'ClusterRoleBinding',
  metadata: {
    name: `user-${roleName}-binding`,
    ...(clusters && clusters.length > 0 && {
      annotations: {
        'cluster.open-cluster-management.io/clusters': clusters.join(',')
      }
    })
  },
  subjects: [createBaseSubject(userName)],
  roleRef: createBaseRoleRef(roleName)
})

const createYamlRoleBinding = (roleName: string, userName: string, namespace: string, clusters?: string[]) => ({
  apiVersion: RbacApiVersion,
  kind: 'RoleBinding',
  namespace,
  metadata: {
    name: `user-${roleName}-binding`,
    namespace,
    ...(clusters && clusters.length > 0 && {
      annotations: {
        'cluster.open-cluster-management.io/clusters': clusters.join(',')
      }
    })
  },
  subjects: [createBaseSubject(userName)],
  roleRef: createBaseRoleRef(roleName)
})

interface CreateRoleAssignmentProps {
  roles: ClusterRole[]
  clusters: ManagedCluster[]
  getNamespaces: (clusters: ManagedCluster[]) => Namespace[]
  userId: string
  onCancel: () => void
  onSave: (resource: any) => void
  showYaml?: boolean
  onToggleYaml?: (show: boolean) => void
  onFormChange?: (formState: { selectedRoles: string[], canSave: boolean }) => void
  shouldSave?: boolean
  onSaveComplete?: () => void
}

export const CreateRoleAssignment = (props: CreateRoleAssignmentProps) => {
  const { t } = useTranslation()
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [scope, setScope] = useState<'everything' | 'specific'>('everything')
  const [selectedClusters, setSelectedClusters] = useState<string[]>([])
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([])
  const [useTagsForClusters, setUseTagsForClusters] = useState(false)

  const { data: users } = useQuery(listUsers)
  const currentUser = users?.find(u => u.metadata.uid === props.userId)
  const userName = currentUser?.metadata.name || props.userId
  
  useEffect(() => {
    if (props.shouldSave && selectedRoles.length > 0) {
      const roleName = selectedRoles[0]
      
      if (scope === 'everything') {
        const clusterRoleBinding = createClusterRoleBinding(roleName, userName)
        props.onSave(clusterRoleBinding as any)
      } else {
        const namespace = selectedNamespaces[0] || 'default'
        const clusters = selectedClusters.length > 0 ? selectedClusters : undefined
        const roleBinding = createRoleBinding(roleName, userName, namespace, clusters)
        props.onSave(roleBinding as any)
      }
      if (props.onSaveComplete) {
        props.onSaveComplete()
      }
    }
  }, [props.shouldSave, selectedRoles, scope, selectedNamespaces, selectedClusters, userName, props.onSave, props.onSaveComplete])

  useEffect(() => {
    const canSave = selectedRoles.length > 0
    props.onFormChange?.({ selectedRoles, canSave })
  }, [selectedRoles])

  const handleRolesChange = (value: string[] | undefined) => setSelectedRoles(value ?? [])
  const handleClustersChange = (value: string[] | undefined) => setSelectedClusters(value ?? [])
  const handleNamespacesChange = (value: string[] | undefined) => setSelectedNamespaces(value ?? [])

  const yamlData = useMemo(() => {
    const roles = selectedRoles.length > 0 ? selectedRoles : ['role-name']
    const bindings = []
    
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i]
      if (scope === 'specific' && selectedClusters.length > 0) {
        if (selectedNamespaces.length > 0) {
          for (let j = 0; j < selectedNamespaces.length; j++) {
            const namespace = selectedNamespaces[j]
            bindings.push(createYamlRoleBinding(role, userName, namespace, selectedClusters))
          }
        } else {
          bindings.push(createYamlClusterRoleBinding(role, userName, selectedClusters))
        }
      } else {
        bindings.push(createYamlClusterRoleBinding(role, userName))
      }
    }
    
    return bindings
  }, [userName, selectedRoles, scope, selectedClusters, selectedNamespaces])

  return (
    <div style={{ height: '500px', overflow: 'visible' }}>
      {props.showYaml ? (
        <Drawer isExpanded={props.showYaml} isInline={true} style={{ height: '500px' }}>
          <DrawerContent
            style={{ height: '500px' }}
            panelContent={
              <DrawerPanelContent
                isResizable={true}
                defaultSize="50%"
                minSize="400px"
                style={{ height: '500px' }}
              >
                <div style={{ height: '500px', overflow: 'auto' }}>
                  <SyncEditor
                    variant="toolbar"
                    editorTitle={t('Role Assignment YAML')}
                    readonly={false}
                    resources={yamlData}
                    onClose={() => props.onToggleYaml?.(false)}
                  />
                </div>
              </DrawerPanelContent>
            }
          >
            <DrawerContentBody style={{ padding: '24px', height: '500px', overflow: 'visible' }}>
              <Form>
                {/* Role Selection */}
                <AcmMultiSelect
                  id="role-select"
                  label={t('Select roles')}
                  value={selectedRoles}
                  onChange={handleRolesChange}
                  placeholder={t('Search and select roles...')}
                  isRequired
                  variant={SelectVariant.typeaheadMulti}
                >
                  {props.roles.map(role => (
                    <SelectOption key={role.metadata.name} value={role.metadata.name}>
                      {role.metadata.name}
                    </SelectOption>
                  ))}
                </AcmMultiSelect>

                {/* Scope Selection */}
                <FormGroup label={t('Select scope')} fieldId="scope-select" isRequired>
                  <Radio
                    isChecked={scope === 'everything'}
                    name="scope"
                    onChange={() => setScope('everything')}
                    label={t('Everything / all objects')}
                    id="scope-everything"
                    style={{ marginBottom: '8px' }}
                  />
                  <Radio
                    isChecked={scope === 'specific'}
                    name="scope"
                    onChange={() => setScope('specific')}
                    label={t('Select specific')}
                    id="scope-specific"
                  />
                </FormGroup>

                {/* Cluster Selection */}
                {scope === 'specific' && (
                  <FormGroup
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>{t('Select clusters')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{t('Select using tag')}</span>
                          <Switch
                            id="use-tags-switch"
                            isChecked={useTagsForClusters}
                            onChange={(event, checked) => setUseTagsForClusters(checked)}
                            aria-label={t('Select using tag')}
                          />
                        </div>
                      </div>
                    }
                    fieldId="clusters-select"
                  >
                    <AcmMultiSelect
                      id="clusters-select"
                      label=""
                      value={selectedClusters}
                      onChange={handleClustersChange}
                      placeholder={t('Search and select clusters...')}
                      variant={SelectVariant.typeaheadMulti}
                    >
                      {props.clusters.map(cluster => (
                        <SelectOption key={cluster.metadata.name} value={cluster.metadata.name}>
                          {cluster.metadata.name}
                        </SelectOption>
                      ))}
                    </AcmMultiSelect>
                  </FormGroup>
                )}

                {/* Namespace Selection */}
                {scope === 'specific' && selectedClusters.length > 0 && (
                  <AcmMultiSelect
                    id="namespaces-select"
                    label={t('Select namespace')}
                    value={selectedNamespaces}
                    onChange={handleNamespacesChange}
                    placeholder={t('Search and select namespaces...')}
                    variant={SelectVariant.typeaheadMulti}
                  >
                    {props.getNamespaces(props.clusters.filter(c => selectedClusters.includes(c.metadata.name!))).map(namespace => (
                      <SelectOption key={namespace.metadata.name} value={namespace.metadata.name}>
                        {namespace.metadata.name}
                      </SelectOption>
                    ))}
                  </AcmMultiSelect>
                )}
              </Form>
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      ) : (
        <div style={{ padding: '24px', height: '500px', overflow: 'visible' }}>
          <Form>
            <AcmMultiSelect
              id="role-select-no-yaml"
              label={t('Select roles')}
              value={selectedRoles}
              onChange={handleRolesChange}
              placeholder={t('Search and select roles...')}
              isRequired
              variant={SelectVariant.typeaheadMulti}
            >
              {props.roles.map(role => (
                <SelectOption key={role.metadata.name} value={role.metadata.name}>
                  {role.metadata.name}
                </SelectOption>
              ))}
            </AcmMultiSelect>

            <FormGroup label={t('Select scope')} fieldId="scope-select-no-yaml" isRequired>
              <Radio
                isChecked={scope === 'everything'}
                name="scope"
                onChange={() => setScope('everything')}
                label={t('Everything / all objects')}
                id="scope-everything-no-yaml"
                style={{ marginBottom: '8px' }}
              />
              <Radio
                isChecked={scope === 'specific'}
                name="scope"
                onChange={() => setScope('specific')}
                label={t('Select specific')}
                id="scope-specific-no-yaml"
              />
            </FormGroup>

            {scope === 'specific' && (
              <FormGroup
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{t('Select clusters')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{t('Select using tag')}</span>
                      <Switch
                        id="use-tags-switch-no-yaml"
                        isChecked={useTagsForClusters}
                        onChange={(event, checked) => setUseTagsForClusters(checked)}
                        aria-label={t('Select using tag')}
                      />
                    </div>
                  </div>
                }
                fieldId="clusters-select-no-yaml"
              >
                <AcmMultiSelect
                  id="clusters-select-no-yaml"
                  label=""
                  value={selectedClusters}
                  onChange={handleClustersChange}
                  placeholder={t('Search and select clusters...')}
                  variant={SelectVariant.typeaheadMulti}
                >
                  {props.clusters.map(cluster => (
                    <SelectOption key={cluster.metadata.name} value={cluster.metadata.name}>
                      {cluster.metadata.name}
                    </SelectOption>
                  ))}
                </AcmMultiSelect>
              </FormGroup>
            )}

            {scope === 'specific' && selectedClusters.length > 0 && (
              <AcmMultiSelect
                id="namespaces-select-no-yaml"
                label={t('Select namespace')}
                value={selectedNamespaces}
                onChange={handleNamespacesChange}
                placeholder={t('Search and select namespaces...')}
                variant={SelectVariant.typeaheadMulti}
              >
                {props.getNamespaces(props.clusters.filter(c => selectedClusters.includes(c.metadata.name!))).map(namespace => (
                  <SelectOption key={namespace.metadata.name} value={namespace.metadata.name}>
                    {namespace.metadata.name}
                  </SelectOption>
                ))}
              </AcmMultiSelect>
            )}
          </Form>
        </div>
      )}
    </div>
  )
}

interface CreateRoleAssignmentModalProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateRoleAssignmentModal({ onSuccess, onCancel }: CreateRoleAssignmentModalProps) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [showYaml, setShowYaml] = useState(true)
  const [canSave, setCanSave] = useState(false)
  const [shouldSave, setShouldSave] = useState(false)
  const toastContext = useContext(AcmToastContext)

  const { data: availableRoles, loading: rolesLoading } = useQuery(listClusterRoles)

  const { data: managedClusters } = useQuery(getManagedClusters)

  const { data: namespaces } = useQuery(listNamespaces)

  const roles = useMemo(() => {
    return availableRoles ?? []
  }, [availableRoles])

  const clusters = useMemo(() => {
    return managedClusters ?? []
  }, [managedClusters])

  const getNamespaces = useCallback((clusters: ManagedCluster[]) => {
    return namespaces ?? []
  }, [namespaces])

  const handleCancel = useCallback(() => {
    onCancel?.()
  }, [onCancel])

  const handleSave = useCallback((resource: any) => {
    createResource(resource).promise.then(() => {
      toastContext.addAlert({
        title: t('Role assignment created'),
        message: t('The role assignment has been successfully created.'),
        type: 'success',
        autoClose: true,
      })
      handleCancel()
      onSuccess?.()
    }).catch((error) => {
      toastContext.addAlert({
        title: t('Failed to create role assignment'),
        message: error.message || t('An error occurred while creating the role assignment.'),
        type: 'danger',
        autoClose: true,
      })
    })
  }, [t, toastContext, handleCancel, onSuccess])

  const handleFormChange = useCallback((formState: { selectedRoles: string[], canSave: boolean }) => {
    setCanSave(formState.canSave)
  }, [])

  const handleSaveClick = useCallback(() => {
    setShouldSave(true)
  }, [])

  const customTitle = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2rem' }}>
      <span>{t('Create Role Assignment')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Switch
          id="yaml-toggle"
          label="YAML"
          isChecked={showYaml}
          onChange={(_event, checked) => setShowYaml(checked)}
          aria-label={t('YAML toggle')}
        />
        <OutlinedQuestionCircleIcon style={{ fontSize: '14px', margin: '0 10px' }} />
      </div>
    </div>
  )


  return (
    <>
      <AcmModal
        variant="large"
        title={customTitle}
        isOpen={true}
        onClose={handleCancel}
        hasNoBodyWrapper
        actions={[
          <AcmButton 
            key="save" 
            variant="primary" 
            onClick={handleSaveClick}
            isDisabled={!canSave}
          >
            {t('Save')}
          </AcmButton>,
          <AcmButton key="cancel" variant="secondary" onClick={handleCancel}>
            {t('Cancel')}
          </AcmButton>,
        ]}
      >
        <CreateRoleAssignment
          roles={roles ?? []}
          clusters={clusters ?? []}
          getNamespaces={getNamespaces}
          userId={id ?? ''}
          onCancel={handleCancel}
          onSave={handleSave}
          showYaml={showYaml}
          onToggleYaml={setShowYaml}
          onFormChange={handleFormChange}
          shouldSave={shouldSave}
          onSaveComplete={() => setShouldSave(false)}
        />
      </AcmModal>
    </>
  )
}

export default CreateRoleAssignmentModal 