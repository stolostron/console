/* Copyright Contributors to the Open Cluster Management project */
import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { Drawer, DrawerContent, SelectOption, Wizard, WizardHeader, WizardStep } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { isType } from '../../lib/is-type'
import { GroupKind, ManagedClusterSet, UserKind } from '../../resources'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { AcmSelect } from '../../ui-components'
import { ClusterGranularityStepContent } from './ClusterGranularityWizardStep'
import { GranularityStepContent } from './GranularityStepContent'
import { IdentitiesList } from './Identities/IdentitiesList'
import { ReviewStepContent } from './ReviewStepContent'
import { RolesList } from './Roles/RolesList'
import { ClusterSetAccessLevel } from './Scope/AccessLevel/ClusterSetAccessLevel'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'
import { ScopeSelectionStepContent } from './ScopeSelectionStepContent'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'
import { usePreselectedData } from './usePreselectedData'

const getWizardTitle = (
  isEditing: boolean | undefined,
  preselected: RoleAssignmentPreselected | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  switch (true) {
    case isEditing:
      return t('Edit role assignment')
    case preselected?.subject?.value !== undefined:
      return t('Create role assignment for {{preselected}}', { preselected: preselected.subject.value })
    case preselected?.roles && preselected.roles.length > 0:
      return t('Create role assignment for {{preselected}}', { preselected: preselected.roles[0] })
    case preselected?.clusterNames && preselected.clusterNames.length > 0:
      return t('Create role assignment for {{preselected}}', { preselected: preselected.clusterNames.join(', ') })
    case preselected?.clusterSetNames && preselected.clusterSetNames.length > 0:
      return t('Create role assignment for {{preselected}}', { preselected: preselected.clusterSetNames.join(', ') })
    default:
      return t('Create role assignment')
  }
}

const getInitialSelectedIdentity = (
  formData: RoleAssignmentWizardFormData
): { kind: 'User' | 'Group'; name: string } | undefined => {
  switch (true) {
    case formData.subject?.kind === 'User' && formData.subject.user?.[0] !== undefined:
      return { kind: 'User', name: formData.subject.user[0] }
    case formData.subject?.kind === 'Group' && formData.subject.group?.[0] !== undefined:
      return { kind: 'Group', name: formData.subject.group[0] }
    default:
      return undefined
  }
}

const getInitialFormData = (): RoleAssignmentWizardFormData => ({
  subject: { kind: UserKind },
  scope: {
    kind: 'all',
    clusterNames: [],
    namespaces: [],
  },
  roles: [],
  scopeType: 'Global access',
  clusterSetAccessLevel: 'Cluster set role assignment',
  selectedClustersAccessLevel: 'Cluster role assignment',
})

export const RoleAssignmentWizardModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  preselected,
  isLoading,
}: RoleAssignmentWizardModalProps) => {
  const { t } = useTranslation()
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
  const [formData, setFormData] = useState<RoleAssignmentWizardFormData>(getInitialFormData())
  const [selectedClusterSets, setSelectedClusterSets] = useState<any[]>([])
  const [selectedClusters, setSelectedClusters] = useState<any[]>([])

  const update = useCallback((updateFn?: (draft: RoleAssignmentWizardFormData) => void) => {
    setFormData((prev) => {
      if (updateFn) {
        const draft = { ...prev, scope: { ...prev.scope } }
        updateFn(draft)
        return draft
      }
      return { ...prev }
    })
  }, [])

  const handleClusterSetsChange = useCallback((clusterSets: ManagedClusterSet[]) => {
    setSelectedClusterSets(clusterSets)
    setSelectedClusters([])
    setFormData((prev) => ({
      ...prev,
      selectedClusterSets: clusterSets,
      selectedClusters: [],
      scope: {
        ...prev.scope,
        namespaces: [],
      },
    }))
  }, [])

  const handleClustersChange = useCallback((clusters: any[]) => {
    setSelectedClusters(clusters)
    setFormData((prev) => ({
      ...prev,
      selectedClusters: clusters,
      scope: {
        ...prev.scope,
        namespaces: clusters.length === 0 ? [] : prev.scope.namespaces,
      },
    }))
  }, [])

  const handleScopeTypeChange = useCallback((scopeType?: RoleAssignmentWizardFormData['scopeType']) => {
    setFormData((prev) => ({ ...prev, scopeType }))
  }, [])

  const handleRoleSelect = useCallback((roleName: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: [roleName],
    }))
  }, [])

  const handleSubjectKindChange = useCallback((kind: string) => {
    setFormData((prev) => ({
      ...prev,
      subject: {
        ...prev.subject,
        kind: kind as typeof UserKind | typeof GroupKind,
      },
    }))
  }, [])

  const handleUserChange = useCallback((users: string[]) => {
    setFormData((prev) => ({
      ...prev,
      subject: {
        ...prev.subject,
        user: users,
      },
    }))
  }, [])

  const handleGroupChange = useCallback((groups: string[]) => {
    setFormData((prev) => ({
      ...prev,
      subject: {
        ...prev.subject,
        group: groups,
      },
    }))
  }, [])

  const handleNamespacesChange = useCallback((namespaces: string[]) => {
    setFormData((prev) => ({
      ...prev,
      scope: {
        ...prev.scope,
        namespaces,
      },
    }))
  }, [])

  const handleClustersAccessLevelChange = useCallback(
    (clustersAccessLevel?: RoleAssignmentWizardFormData['selectedClustersAccessLevel']) => {
      setFormData((prev) => ({
        ...prev,
        selectedClustersAccessLevel: clustersAccessLevel,
      }))
    },
    []
  )

  const handleClusterSetAccessLevelChange = useCallback(
    (clusterSetAccessLevel?: RoleAssignmentWizardFormData['clusterSetAccessLevel']) => {
      setFormData((prev) => ({
        ...prev,
        clusterSetAccessLevel: clusterSetAccessLevel,
      }))
    },
    []
  )

  const handleClose = useCallback(() => {
    setIsDrawerExpanded(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(() => onSubmit(formData), [formData, onSubmit])

  useEffect(() => {
    if (!isOpen || !isEditing) {
      setFormData(getInitialFormData())
      setSelectedClusterSets([])
      setSelectedClusters([])
    }
  }, [isOpen, isEditing])

  usePreselectedData({
    isOpen,
    preselected,
    setFormData,
    setSelectedClusterSets,
    setSelectedClusters,
  })

  useEffect(() => {
    const newKind = formData.scopeType === 'Global access' ? 'all' : 'specific'
    if (formData.scope.kind !== newKind) {
      setFormData((prev) => ({
        ...prev,
        scope: {
          ...prev.scope,
          kind: newKind,
          namespaces: newKind === 'all' ? undefined : prev.scope.namespaces,
        },
      }))
    }
  }, [formData.scopeType, formData.scope.kind])

  const showIdentitiesStep =
    preselected?.context !== 'identity' &&
    (isEditing ||
      (!isEditing &&
        (preselected?.roles?.[0] || preselected?.clusterSetNames?.[0] || preselected?.clusterNames?.[0]) &&
        !preselected?.subject))

  const hideRolesStep = preselected?.context === 'role'

  const title = getWizardTitle(isEditing, preselected, t)

  const hasNoClusterSets = selectedClusterSets.length === 0
  const hasNoClusters = selectedClusters.length === 0
  const isScopeInvalid =
    (formData.scopeType === 'Select cluster sets' && hasNoClusterSets) ||
    (formData.scopeType === 'Select clusters' && hasNoClusters)

  const hasChanges = useMemo(() => {
    if (!isEditing) return true

    const roleChanged = preselected?.roles?.[0] !== formData.roles?.[0]
    const clustersChanged =
      JSON.stringify(preselected?.clusterNames?.toSorted() ?? []) !==
      JSON.stringify(formData.selectedClusters?.map((c) => c.metadata?.name || c.name || c).toSorted() ?? [])
    const namespacesChanged =
      JSON.stringify((preselected?.namespaces ?? []).toSorted()) !==
      JSON.stringify((formData.scope.namespaces ?? []).toSorted())

    const identityKindChanged = preselected?.subject?.kind !== formData.subject?.kind
    const identityValueChanged = (() => {
      switch (true) {
        case !preselected?.subject?.value:
          return false
        case formData.subject?.kind === 'User':
          return preselected.subject.value !== formData.subject.user?.[0]
        case formData.subject?.kind === 'Group':
          return preselected.subject.value !== formData.subject.group?.[0]
        default:
          return false
      }
    })()

    return roleChanged || clustersChanged || namespacesChanged || identityKindChanged || identityValueChanged
  }, [isEditing, preselected, formData])

  const scopeSubSteps = [
    <WizardStep
      key="scope-selection"
      name={t('Select scope')}
      id="scope-selection"
      isHidden={(['cluster', 'clusterSets'] as RoleAssignmentPreselected['context'][]).includes(preselected?.context)}
      footer={{
        isNextDisabled: isScopeInvalid,
      }}
    >
      <ScopeSelectionStepContent
        isDrawerExpanded={isDrawerExpanded}
        setIsDrawerExpanded={setIsDrawerExpanded}
        selectedClusterSets={selectedClusterSets}
        selectedClusters={selectedClusters}
        onSelectClusterSets={handleClusterSetsChange}
        onSelectClusters={handleClustersChange}
        onSelectScopeType={handleScopeTypeChange}
        selectedScope={formData.scopeType}
      />
    </WizardStep>,
    <WizardStep
      key="cluster-set-granularity"
      name={t('Define cluster set granularity')}
      id="scope-cluster-set-granularity"
      isHidden={formData.scopeType !== 'Select cluster sets' || hasNoClusterSets}
      footer={{
        isNextDisabled: formData.clusterSetAccessLevel === 'Cluster role assignment' && hasNoClusters,
      }}
    >
      <GranularityStepContent
        title={t('Choose access level')}
        description={t('Define the level of access for the 1 selected cluster set.')}
      />
      <div style={{ margin: '16px 0' }}>
        <AcmSelect
          id="clusters-set-access-level"
          value={formData.clusterSetAccessLevel}
          onChange={(value) =>
            handleClusterSetAccessLevelChange(value as RoleAssignmentWizardFormData['clusterSetAccessLevel'])
          }
          isRequired
          label="Access level"
        >
          {[
            {
              label: t('Cluster set role assignment'),
              value: 'Cluster set role assignment',
              description: t('Grant access to all current and future resources on the cluster set'),
            },
            {
              label: t('Cluster role assignment'),
              value: 'Cluster role assignment',
              description: t(
                'Grant access to specific clusters on the cluster set. Optionally, narrow this access to projects on the selected clusters'
              ),
            },
          ].map((option) => (
            <SelectOption key={option.value} value={option.value} description={option.description}>
              {option.label}
            </SelectOption>
          ))}
        </AcmSelect>
      </div>
      {formData.clusterSetAccessLevel === 'Cluster role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterList
            selectedClusters={selectedClusters}
            namespaces={formData.selectedClusterSets
              ?.map((cs) =>
                (cs as ManagedClusterSet).metadata ? (cs as ManagedClusterSet).metadata.name : (cs as string)
              )
              .filter(isType)}
            onSelectCluster={(clusters) => {
              handleClustersChange(clusters)
            }}
          />
        </div>
      )}
      {[undefined, 'Cluster set role assignment'].includes(formData.clusterSetAccessLevel) && <ClusterSetAccessLevel />}
    </WizardStep>,
    <WizardStep
      key="cluster-set-cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-set-cluster-granularity"
      isHidden={
        formData.scopeType !== 'Select cluster sets' ||
        hasNoClusterSets ||
        formData.clusterSetAccessLevel !== 'Cluster role assignment' ||
        hasNoClusters
      }
    >
      <ClusterGranularityStepContent
        description={t('Define cluster granularity options.')}
        selectedClusters={selectedClusters}
        selectedNamespaces={formData.scope.namespaces}
        onNamespacesChange={handleNamespacesChange}
        selectedClustersAccessLevel={formData.selectedClustersAccessLevel}
        onClustersAccessLevelChange={handleClustersAccessLevelChange}
      />
    </WizardStep>,
    <WizardStep
      key="cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-granularity"
      isHidden={formData.scopeType !== 'Select clusters' || hasNoClusters}
    >
      <ClusterGranularityStepContent
        description={t('Define the level of access for the selected cluster(s).')}
        selectedClusters={selectedClusters}
        selectedNamespaces={formData.scope.namespaces}
        onNamespacesChange={handleNamespacesChange}
        selectedClustersAccessLevel={formData.selectedClustersAccessLevel}
        onClustersAccessLevelChange={handleClustersAccessLevelChange}
      />
    </WizardStep>,
  ]

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} showClose={false} hasNoBodyWrapper>
      <Drawer isExpanded={isDrawerExpanded}>
        <DrawerContent panelContent={<ExampleScopesPanelContent onClose={() => setIsDrawerExpanded(false)} />}>
          <ItemContext.Provider value={formData}>
            <DataContext.Provider value={{ update }}>
              <Wizard
                isVisitRequired={!isEditing}
                onClose={handleClose}
                header={
                  <WizardHeader
                    onClose={handleClose}
                    title={title}
                    titleId="role-assignment-wizard-label"
                    description={
                      <div>
                        <p>
                          {t(
                            'A role assignment specifies a distinct action users or groups can perform when associated with a particular role.'
                          )}
                        </p>
                        <Link to={DOC_LINKS.ACM_WELCOME} target="_blank">
                          {t('Learn more about user management, including an example YAML file.')}
                        </Link>
                      </div>
                    }
                    descriptionId="role-assignment-wizard-description"
                    closeButtonAriaLabel={t('Close wizard')}
                    isCloseHidden={isLoading}
                  />
                }
              >
                {showIdentitiesStep && (
                  <WizardStep
                    key="identities"
                    name={t('Identities')}
                    id="identities"
                    footer={{
                      isNextDisabled:
                        !formData.subject || (!formData.subject.user?.length && !formData.subject.group?.length),
                    }}
                  >
                    <IdentitiesList
                      onUserSelect={(user) => {
                        handleSubjectKindChange('User')
                        handleUserChange(user.metadata.name ? [user.metadata.name] : [])
                      }}
                      onGroupSelect={(group) => {
                        handleSubjectKindChange('Group')
                        handleGroupChange(group.metadata.name ? [group.metadata.name] : [])
                      }}
                      initialSelectedIdentity={getInitialSelectedIdentity(formData)}
                    />
                  </WizardStep>
                )}

                <WizardStep
                  key="scope"
                  name={t('Scope')}
                  id="scope"
                  steps={scopeSubSteps}
                  footer={{
                    isNextDisabled: isScopeInvalid,
                  }}
                />

                {!hideRolesStep && (
                  <WizardStep
                    key="role"
                    name={t('Roles')}
                    id="role"
                    footer={{
                      isNextDisabled: !formData.roles || formData.roles.length === 0,
                    }}
                  >
                    <RolesList onRadioSelect={handleRoleSelect} selectedRole={formData.roles?.[0]} />
                  </WizardStep>
                )}

                <WizardStep
                  key="review"
                  name={t('Review')}
                  id="review"
                  footer={{
                    nextButtonText: isEditing ? t('Save') : t('Create'),
                    onNext: handleSubmit,
                    nextButtonProps: { isLoading },
                    isBackDisabled: isLoading,
                    cancelButtonProps: { isDisabled: isLoading },
                    isNextDisabled: isEditing && !hasChanges,
                  }}
                >
                  <ReviewStepContent
                    formData={formData}
                    preselected={preselected}
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                  />
                </WizardStep>
              </Wizard>
            </DataContext.Provider>
          </ItemContext.Provider>
        </DrawerContent>
      </Drawer>
    </Modal>
  )
}
