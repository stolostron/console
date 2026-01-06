/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { Wizard, WizardStep, WizardHeader, Drawer, DrawerContent } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { useState, useCallback } from 'react'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { GranularityStepContent } from './GranularityStepContent'
import { ScopeSelectionStepContent } from './ScopeSelectionStepContent'
import { RoleAssignmentWizardModalProps, RoleAssignmentWizardFormData } from './types'
import { RoleSelectionStepContent } from './RoleSelectionStepContent'
import { ClusterSetAccessLevel } from './Scope/AccessLevel/ClusterSetAccessLevel'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { ProjectsList } from './ProjectsList'
import { ReviewStepContent } from './ReviewStepContent'
import { IdentitiesList } from './Identities/IdentitiesList'
import { UserKind, GroupKind } from '../../resources'
import { useEffect } from 'react'

const getInitialFormData = (): RoleAssignmentWizardFormData => ({
  subject: { kind: UserKind },
  scope: {
    kind: 'all',
    clusterNames: [],
  },
  roles: [],
  scopeType: 'Global access',
})

export const RoleAssignmentWizardModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  preselected,
}: RoleAssignmentWizardModalProps) => {
  const { t } = useTranslation()
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
  const [formData, setFormData] = useState<RoleAssignmentWizardFormData>(getInitialFormData())
  const [selectedClusterSets, setSelectedClusterSets] = useState<any[]>([])
  const [selectedClusters, setSelectedClusters] = useState<any[]>([])

  const update = useCallback(() => {
    setFormData((prev) => ({ ...prev }))
  }, [])

  const handleClusterSetsChange = useCallback((clusterSets: any[]) => {
    setSelectedClusterSets(clusterSets)
    setFormData((prev) => ({ ...prev, selectedClusterSets: clusterSets }))
  }, [])

  const handleClustersChange = useCallback((clusters: any[]) => {
    setSelectedClusters(clusters)
    setFormData((prev) => ({ ...prev, selectedClusters: clusters }))
  }, [])

  const handleRoleSelect = useCallback((roleName: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName) ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName],
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

  const handleClose = useCallback(() => {
    setFormData(getInitialFormData())
    setSelectedClusterSets([])
    setSelectedClusters([])
    setIsDrawerExpanded(false)
    onClose()
  }, [onClose])

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData)
    } else {
      handleClose()
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const subject = preselected?.subject
    if (subject) {
      setFormData((prev) => ({
        ...prev,
        subject: {
          kind: subject.kind,
          user: subject.kind === UserKind && subject.value ? [subject.value] : undefined,
          group: subject.kind === GroupKind && subject.value ? [subject.value] : undefined,
        },
      }))
    }
  }, [preselected, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const roles = preselected?.roles
    if (roles && roles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        roles: roles,
      }))
    }
  }, [preselected, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (preselected?.clusterNames && preselected.clusterNames.length > 0) {
      setFormData((prev) => ({
        ...prev,
        scopeType: 'Select clusters',
        scope: {
          kind: 'specific',
          clusterNames: preselected.clusterNames,
        },
        selectedClusters: preselected.clusterNames,
      }))
      setSelectedClusters(preselected.clusterNames)
    }
  }, [preselected, isOpen])

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

  const showIdentitiesStep = preselected?.roles && preselected.roles.length > 0 && !preselected?.subject

  const hideRolesStep = preselected?.roles && preselected.roles.length > 0

  const title = isEditing
    ? t('Edit role assignment')
    : t('Create role assignment for {{preselected}}', { preselected: preselected?.subject?.value })

  const scopeSubSteps = [
    <WizardStep key="scope-selection" name={t('Select scope')} id="scope-selection">
      <ScopeSelectionStepContent
        isDrawerExpanded={isDrawerExpanded}
        setIsDrawerExpanded={setIsDrawerExpanded}
        onSelectClusterSets={handleClusterSetsChange}
        onSelectClusters={handleClustersChange}
      />
    </WizardStep>,
    <WizardStep
      key="cluster-set-granularity"
      name={t('Define cluster set granularity')}
      id="scope-cluster-set-granularity"
      isHidden={formData.scopeType !== 'Select cluster sets'}
    >
      <GranularityStepContent
        title={t('Choose access level')}
        description={t('Define the level of access for the 1 selected cluster set.')}
      />
      <div style={{ margin: '16px 0' }}>
        <WizSelect
          pathValueToInputValue={(pathValue) => pathValue || 'Cluster set role assignment'}
          path="clusterSetAccessLevel"
          label="Access level"
          required
          options={[
            {
              label: 'Cluster set role assignment',
              value: 'Cluster set role assignment',
              description: 'Grant access to all current and future resources on the cluster set',
            },
            {
              label: 'Cluster role assignment',
              value: 'Cluster role assignment',
              description:
                'Grant access to specific clusters on the cluster set. Optionally, narrow this access to projects on the selected clusters',
            },
          ]}
        />
      </div>
      {formData.clusterSetAccessLevel === 'Cluster role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterList
            onSelectCluster={(clusters) => {
              handleClustersChange(clusters)
            }}
          />
        </div>
      )}
      <ClusterSetAccessLevel />
    </WizardStep>,
    <WizardStep
      key="cluster-set-cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-set-cluster-granularity"
      isHidden={
        formData.scopeType !== 'Select cluster sets' || formData.clusterSetAccessLevel !== 'Cluster role assignment'
      }
    >
      <GranularityStepContent
        title={t('Define cluster granularity')}
        description={t('Define cluster granularity options.')}
      />
      <div style={{ margin: '16px 0' }}>
        <WizSelect
          pathValueToInputValue={(pathValue) => pathValue || 'Cluster role assignment'}
          path="selectedClustersAccessLevel"
          label="Access level for selected clusters"
          required
          options={[
            {
              label: 'Cluster role assignment',
              value: 'Cluster role assignment',
              description: 'Grant access to all current and future resources on the cluster',
            },
            {
              label: 'Project role assignment',
              value: 'Project role assignment',
              description: 'Grant access to specific projects on the cluster',
            },
          ]}
        />
      </div>
      {formData.selectedClustersAccessLevel === 'Project role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ProjectsList selectedClusters={[{ name: 'local-cluster' }]} />
        </div>
      )}
    </WizardStep>,
    <WizardStep
      key="cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-granularity"
      isHidden={formData.scopeType !== 'Select clusters'}
    >
      <GranularityStepContent
        title={t('Define cluster granularity')}
        description={t('Define the level of access for the selected cluster(s).')}
      />
      <div style={{ margin: '16px 0' }}>
        <WizSelect
          pathValueToInputValue={(pathValue) => pathValue || 'Cluster role assignment'}
          path="selectedClustersAccessLevel"
          label="Access level for selected clusters"
          required
          options={[
            {
              label: 'Cluster role assignment',
              value: 'Cluster role assignment',
              description: 'Grant access to all current and future resources on the cluster',
            },
            {
              label: 'Project role assignment',
              value: 'Project role assignment',
              description: 'Grant access to specific projects on the cluster',
            },
          ]}
        />
      </div>
      {formData.selectedClustersAccessLevel === 'Project role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ProjectsList selectedClusters={selectedClusters} />
        </div>
      )}
    </WizardStep>,
  ]

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} showClose={false} hasNoBodyWrapper>
      <Drawer isExpanded={isDrawerExpanded}>
        <DrawerContent
          panelContent={
            <ExampleScopesPanelContent isVisible={isDrawerExpanded} onClose={() => setIsDrawerExpanded(false)} />
          }
        >
          <ItemContext.Provider value={formData}>
            <DataContext.Provider value={{ update }}>
              <Wizard
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
                        <a href="https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.0/html/about/welcome-to-red-hat-advanced-cluster-management-for-kubernetes">
                          Learn more about user management, including an example YAML file.
                        </a>
                      </div>
                    }
                    descriptionId="role-assignment-wizard-description"
                    closeButtonAriaLabel={t('Close wizard')}
                  />
                }
              >
                {showIdentitiesStep && (
                  <WizardStep key="identities" name={t('Identities')} id="identities">
                    <IdentitiesList
                      onUserSelect={(user) => {
                        handleSubjectKindChange('User')
                        handleUserChange(user.metadata.name ? [user.metadata.name] : [])
                      }}
                      onGroupSelect={(group) => {
                        handleSubjectKindChange('Group')
                        handleGroupChange(group.metadata.name ? [group.metadata.name] : [])
                      }}
                    />
                  </WizardStep>
                )}

                <WizardStep
                  key="scope"
                  name={t('Scope')}
                  id="scope"
                  steps={scopeSubSteps}
                  footer={{
                    isNextDisabled:
                      (formData.scopeType === 'Select cluster sets' && selectedClusterSets.length === 0) ||
                      (formData.scopeType === 'Select clusters' && selectedClusters.length === 0),
                  }}
                />

                {!hideRolesStep && (
                  <WizardStep key="role" name={t('Roles')} id="role">
                    <RoleSelectionStepContent onRoleSelect={handleRoleSelect} />
                  </WizardStep>
                )}

                <WizardStep
                  key="review"
                  name={t('Review')}
                  id="review"
                  footer={{ nextButtonText: t('Create'), onNext: handleSubmit }}
                >
                  <ReviewStepContent formData={formData} />
                </WizardStep>
              </Wizard>
            </DataContext.Provider>
          </ItemContext.Provider>
        </DrawerContent>
      </Drawer>
    </Modal>
  )
}
