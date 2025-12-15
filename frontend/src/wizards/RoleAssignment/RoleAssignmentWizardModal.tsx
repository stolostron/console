/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { Wizard, WizardStep, WizardHeader, Drawer, DrawerContent, Button, Title, Content } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { useState, useCallback } from 'react'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'
import { WizSelect } from '@patternfly-labs/react-form-wizard/lib/src/inputs/WizSelect'
import { ClusterSetAccessLevel } from './Scope/AccessLevel/ClusterSetAccessLevel'
import { useItem, ItemContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ItemContext'
import { DataContext } from '@patternfly-labs/react-form-wizard/lib/src/contexts/DataContext'
import { ClusterSetsList } from './Scope/ClusterSets/ClusterSetsList'
import { ClusterList } from './Scope/Clusters/ClusterList'

interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

const ScopeStepContent = ({
  isDrawerExpanded,
  setIsDrawerExpanded,
}: {
  isDrawerExpanded: boolean
  setIsDrawerExpanded: (expanded: boolean) => void
}) => {
  const { t } = useTranslation()
  const item = useItem()
  const selectedScope = item?.scope
  console.log(selectedScope, 'selectedScope')
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
      {(() => {
        switch (selectedScope) {
          case 'Global access':
            return (
              <div style={{ marginTop: '16px' }}>
                <ClusterSetAccessLevel />
              </div>
            )
          case 'Select cluster sets':
            return (
              <div style={{ marginTop: '16px' }}>
                <ClusterSetsList onSelectClusterSet={(clusterSets) => console.log(clusterSets)} />
              </div>
            )
          case 'Select clusters':
            return (
              <div style={{ marginTop: '16px' }}>
                <ClusterList onSelectCluster={(clusters) => console.log(clusters)} />
              </div>
            )
          default:
            return null
        }
      })()}
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
  const [formData, setFormData] = useState({ scope: 'Global access' })

  const update = useCallback(() => {
    setFormData({ ...formData })
  }, [formData])

  const handleSubmit = async () => {
    if (onSubmit) {
      // TODO: Collect data from wizard steps
      await onSubmit(formData)
    }
    onClose()
  }
  console.log(preselected, 'preselected')
  const title = isEditing
    ? t('Edit role assignment')
    : t('Create role assignment for {{preselected}}', { preselected: preselected?.subject?.value })

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
                <WizardStep name={t('Scope')} id="scope">
                  <ScopeStepContent isDrawerExpanded={isDrawerExpanded} setIsDrawerExpanded={setIsDrawerExpanded} />
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
