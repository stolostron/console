/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { Wizard, WizardStep, WizardHeader, Drawer, DrawerContent, Button, Title, Content } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { useState, useCallback } from 'react'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { useItem, ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ClusterSetsList } from './Scope/ClusterSets/ClusterSetsList'
import { ClusterList } from './Scope/Clusters/ClusterList'
import { GlobalScopeSelection } from './Scope/GlobalScopeSelection'

interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

const GranularityStepContent = ({ title, description }: { title: string; description: string }) => {
  return (
    <div>
      <Title headingLevel="h2" size="xl">
        {title}
      </Title>
      <Content component="p" style={{ marginTop: '8px' }}>
        {description}
      </Content>
    </div>
  )
}

const ScopeSelectionStepContent = ({
  isDrawerExpanded,
  setIsDrawerExpanded,
  onSelectClusterSets,
  onSelectClusters,
}: {
  isDrawerExpanded: boolean
  setIsDrawerExpanded: (expanded: boolean) => void
  onSelectClusterSets?: (clusterSets: any[]) => void
  onSelectClusters?: (clusters: any[]) => void
}) => {
  const { t } = useTranslation()
  const item = useItem()
  const selectedScope = item?.scope
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <Title headingLevel="h2" size="xl">
          {t('Scope')}
        </Title>
        <Button variant="link" onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}>
          {t('View examples')}
        </Button>
      </div>
      <Content component="p" style={{ marginBottom: '8px' }}>
        {t('Define the scope of access by selecting which resources this role will apply to.')}
      </Content>
      <Content component="p" style={{ marginBottom: '16px' }}>
        {t('Select one option:')}
      </Content>
      <WizSelect
        pathValueToInputValue={(pathValue) => pathValue || 'Global access'}
        path="scope"
        label=""
        required
        options={[
          {
            label: 'Global access',
            value: 'Global access',
            description: 'Grant access to all resources across all clusters registred in ACM',
          },
          {
            label: 'Select cluster sets',
            value: 'Select cluster sets',
            description:
              'Grant access to 1 or more cluster sets. Optionally, narrow this access to specific clusters and projects',
          },
          {
            label: 'Select clusters',
            value: 'Select clusters',
            description: 'Grant access to 1 or more clusters. Optionally, narrow this access to projects',
          },
        ]}
      />
      {selectedScope === 'Global access' && (
        <div style={{ marginTop: '16px' }}>
          <GlobalScopeSelection />
        </div>
      )}
      {selectedScope === 'Select cluster sets' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterSetsList
            onSelectClusterSet={(clusterSets) => {
              onSelectClusterSets?.(clusterSets)
            }}
          />
        </div>
      )}
      {selectedScope === 'Select clusters' && (
        <div style={{ marginTop: '16px' }}>
          <ClusterList
            onSelectCluster={(clusters) => {
              onSelectClusters?.(clusters)
            }}
          />
        </div>
      )}
    </div>
  )
}

export const RoleAssignmentWizardModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  preselected,
}: RoleAssignmentWizardModalProps) => {
  const { t } = useTranslation()
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
  const [formData, setFormData] = useState<{
    scope: string
    selectedClusterSets?: any[]
    selectedClusters?: any[]
  }>({ scope: 'Global access' })
  const [selectedClusterSets, setSelectedClusterSets] = useState<any[]>([])
  const [selectedClusters, setSelectedClusters] = useState<any[]>([])

  const update = useCallback(() => {
    setFormData({ ...formData })
  }, [formData])

  const handleClusterSetsChange = useCallback((clusterSets: any[]) => {
    setSelectedClusterSets(clusterSets)
    setFormData((prev) => ({ ...prev, selectedClusterSets: clusterSets }))
  }, [])

  const handleClustersChange = useCallback((clusters: any[]) => {
    setSelectedClusters(clusters)
    setFormData((prev) => ({ ...prev, selectedClusters: clusters }))
  }, [])

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData)
    }
    onClose()
  }
  const title = isEditing
    ? t('Edit role assignment')
    : t('Create role assignment for {{preselected}}', { preselected: preselected?.subject?.value })

  const scopeSubSteps =
    formData.scope === 'Select cluster sets'
      ? [
          <WizardStep
            key="cluster-sets"
            name={t('Select cluster sets')}
            id="scope-cluster-sets"
            footer={{ isNextDisabled: selectedClusterSets.length === 0 }}
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
          >
            <GranularityStepContent
              title={t('Define cluster set granularity')}
              description={t('Define granular access controls for the selected cluster sets.')}
            />
          </WizardStep>,
          <WizardStep key="cluster-granularity" name={t('Define cluster granularity')} id="scope-cluster-granularity">
            <GranularityStepContent
              title={t('Define cluster granularity')}
              description={t('Define cluster granularity options.')}
            />
          </WizardStep>,
        ]
      : formData.scope === 'Select clusters'
        ? [
            <WizardStep
              key="clusters"
              name={t('Select clusters')}
              id="scope-clusters"
              footer={{ isNextDisabled: selectedClusters.length === 0 }}
            >
              <ScopeSelectionStepContent
                isDrawerExpanded={isDrawerExpanded}
                setIsDrawerExpanded={setIsDrawerExpanded}
                onSelectClusterSets={handleClusterSetsChange}
                onSelectClusters={handleClustersChange}
              />
            </WizardStep>,
            <WizardStep key="cluster-granularity" name={t('Define cluster granularity')} id="scope-cluster-granularity">
              <GranularityStepContent
                title={t('Define cluster granularity')}
                description={t('Define cluster granularity options.')}
              />
            </WizardStep>,
          ]
        : undefined

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
                key={formData.scope}
                onClose={onClose}
                header={
                  <WizardHeader
                    onClose={onClose}
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
                <WizardStep name={t('Scope')} id="scope" {...(scopeSubSteps && { steps: scopeSubSteps })}>
                  <ScopeSelectionStepContent
                    isDrawerExpanded={isDrawerExpanded}
                    setIsDrawerExpanded={setIsDrawerExpanded}
                    onSelectClusterSets={handleClusterSetsChange}
                    onSelectClusters={handleClustersChange}
                  />
                </WizardStep>

                <WizardStep name={t('Roles')} id="role">
                  <div>{t('Step 2 placeholder')}</div>
                </WizardStep>

                <WizardStep
                  name={t('Review')}
                  id="review"
                  footer={{ nextButtonText: t('Create'), onNext: handleSubmit }}
                >
                  <div>{t('Review placeholder')}</div>
                </WizardStep>
              </Wizard>
            </DataContext.Provider>
          </ItemContext.Provider>
        </DrawerContent>
      </Drawer>
    </Modal>
  )
}
