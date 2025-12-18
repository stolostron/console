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
import { RoleAssignmentWizardModalProps, RoleAssignmentFormData } from './types'

export const RoleAssignmentWizardModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  preselected,
}: RoleAssignmentWizardModalProps) => {
  const { t } = useTranslation()
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
  const [formData, setFormData] = useState<RoleAssignmentFormData>({ scope: 'Global access' })
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
