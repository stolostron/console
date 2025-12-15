/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import {
  Modal,
  Wizard,
  WizardStep,
  WizardHeader,
  ModalVariant,
  Drawer,
  DrawerContent,
  Button,
  Title,
  Text,
  TextContent,
} from '@patternfly/react-core'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { useState } from 'react'
import { ExampleScopesPanelContent } from './Scope/ExampleScope/ExampleScopesPanelContent'

interface RoleAssignmentWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  isEditing?: boolean
  preselected?: RoleAssignmentPreselected
}

export function RoleAssignmentWizardModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  preselected,
}: RoleAssignmentWizardModalProps) {
  const { t } = useTranslation()
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)

  const handleSubmit = async () => {
    if (onSubmit) {
      // TODO: Collect data from wizard steps
      await onSubmit({})
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
                <TextContent>
                  <Text component="p">
                    {t('Define the scope of access by selecting which resources this role will apply to.')}
                  </Text>
                </TextContent>
              </div>
            </WizardStep>

            <WizardStep name={t('Roles')} id="role">
              <div>{t('Step 2 placeholder')}</div>
            </WizardStep>

            <WizardStep name={t('Review')} id="review" footer={{ nextButtonText: t('Create'), onNext: handleSubmit }}>
              <div>{t('Review placeholder')}</div>
            </WizardStep>
          </Wizard>
        </DrawerContent>
      </Drawer>
    </Modal>
  )
}
