/* Copyright Contributors to the Open Cluster Management project */
import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { Drawer, DrawerContent, Wizard, WizardHeader, WizardStep } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { isType } from '../../lib/is-type'
import { GroupKind, UserKind } from '../../resources'
import { ClusterGranularityStepContent } from './ClusterGranularityWizardStep'
import { GranularityStepContent } from './GranularityStepContent'
import { IdentitiesList } from './Identities/IdentitiesList'
import { ReviewStepContent } from './ReviewStepContent'
import { RoleSelectionStepContent } from './RoleSelectionStepContent'
import { ClusterSetAccessLevel } from './Scope/AccessLevel/ClusterSetAccessLevel'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'
import { ScopeSelectionStepContent } from './ScopeSelectionStepContent'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'
import { usePreselectedData } from './usePreselectedData'

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
    setSelectedClusters([])
    setFormData((prev) => ({ ...prev, selectedClusterSets: clusterSets, selectedClusters: [] }))
  }, [])

  const handleClustersChange = useCallback((clusters: any[]) => {
    setSelectedClusters(clusters)
    setFormData((prev) => ({ ...prev, selectedClusters: clusters }))
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

  const handleClose = useCallback(() => {
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
    if (isOpen && !isEditing) {
      setFormData(getInitialFormData())
      setSelectedClusterSets([])
      setSelectedClusters([])
    }
  }, [isOpen, isEditing])

  usePreselectedData({
    isOpen,
    preselected,
    setFormData,
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
    ((preselected?.roles && preselected.roles.length > 0) ||
      (preselected?.clusterNames && preselected.clusterNames.length > 0)) &&
    !preselected?.subject

  const hideRolesStep = preselected?.roles && preselected.roles.length > 0

  const title = isEditing
    ? t('Edit role assignment')
    : preselected?.subject?.value
      ? t('Create role assignment for {{preselected}}', { preselected: preselected.subject.value })
      : preselected?.roles && preselected.roles.length > 0
        ? t('Create role assignment for {{preselected}}', { preselected: preselected.roles[0] })
        : preselected?.clusterNames && preselected.clusterNames.length > 0
          ? t('Create role assignment for {{preselected}}', {
              preselected: preselected.clusterNames.join(', '),
            })
          : t('Create role assignment')

  const scopeSubSteps = [
    <WizardStep
      key="scope-selection"
      name={t('Select scope')}
      id="scope-selection"
      isHidden={!!(preselected?.clusterNames && preselected.clusterNames.length > 0)}
    >
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
          ]}
        />
      </div>
      {formData.clusterSetAccessLevel === 'Cluster role assignment' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterList
            selectedClusters={formData.selectedClusters}
            namespaces={formData.selectedClusterSets?.map((cs) => cs.metadata?.name).filter(isType)}
            onSelectCluster={(clusters) => {
              handleClustersChange(clusters)
            }}
          />
        </div>
      )}
      {(formData.clusterSetAccessLevel === undefined ||
        formData.clusterSetAccessLevel === 'Cluster set role assignment') && <ClusterSetAccessLevel />}
    </WizardStep>,
    <WizardStep
      key="cluster-set-cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-set-cluster-granularity"
      isHidden={
        formData.scopeType !== 'Select cluster sets' || formData.clusterSetAccessLevel !== 'Cluster role assignment'
      }
    >
      <ClusterGranularityStepContent
        description={t('Define cluster granularity options.')}
        selectedClusters={selectedClusters}
      />
    </WizardStep>,
    <WizardStep
      key="cluster-granularity"
      name={t('Define cluster granularity')}
      id="scope-cluster-granularity"
      isHidden={formData.scopeType !== 'Select clusters'}
    >
      <ClusterGranularityStepContent
        description={t('Define the level of access for the selected cluster(s).')}
        selectedClusters={selectedClusters}
      />
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
                isVisitRequired
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
                      initialSelectedIdentity={
                        formData.subject?.kind === 'User' && formData.subject.user?.[0]
                          ? { kind: 'User', name: formData.subject.user[0] }
                          : formData.subject?.kind === 'Group' && formData.subject.group?.[0]
                            ? { kind: 'Group', name: formData.subject.group[0] }
                            : undefined
                      }
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
                  <WizardStep
                    key="role"
                    name={t('Roles')}
                    id="role"
                    footer={{
                      isNextDisabled: !formData.roles || formData.roles.length === 0,
                    }}
                  >
                    <RoleSelectionStepContent onRoleSelect={handleRoleSelect} />
                  </WizardStep>
                )}

                <WizardStep
                  key="review"
                  name={t('Review')}
                  id="review"
                  footer={{ nextButtonText: t('Create'), onNext: handleSubmit }}
                >
                  <ReviewStepContent formData={formData} preselected={preselected} />
                </WizardStep>
              </Wizard>
            </DataContext.Provider>
          </ItemContext.Provider>
        </DrawerContent>
      </Drawer>
    </Modal>
  )
}
