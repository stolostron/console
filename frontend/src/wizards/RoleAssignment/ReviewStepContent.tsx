/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Divider,
  Title,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { GranularityStepContent } from './GranularityStepContent'
import { useReviewStepContent } from './ReviewStepContentHook'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface ReviewStepContentProps {
  formData: RoleAssignmentWizardFormData
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
  hasChanges?: boolean
  hasNoClusterSets?: boolean
}

export const ReviewStepContent = ({
  formData,
  preselected,
  isEditing,
  hasChanges,
  hasNoClusterSets,
}: ReviewStepContentProps) => {
  const { t } = useTranslation()

  const { clusterSetsDisplay, clustersDisplay, namespacesDisplay, roleDisplay, identityDisplay } = useReviewStepContent(
    {
      oldData: {
        clusterSetNames: preselected?.clusterSetNames,
        clusterNames: preselected?.clusterNames ?? [],
        namespaces: preselected?.namespaces ?? [],
        role: preselected?.roles?.[0],
        subject: preselected?.subject,
      },
      newData: {
        clusterSetNames: formData.selectedClusterSets,
        clusterNames: formData.selectedClusters?.map((cluster) => cluster.metadata?.name || cluster.name) ?? [],
        namespaces: formData.scope.namespaces ?? [],
        role: formData.roles?.[0],
        subject: formData.subject,
      },
      isEditing,
    }
  )

  return (
    <div>
      <GranularityStepContent title={t('Review')} titleSize="lg" description={''} />
      {!hasChanges && isEditing && (
        <Alert
          variant="danger"
          title={t('No changes have been made. Please modify or cancel to exit.')}
          isInline
          style={{ marginBottom: '16px' }}
        />
      )}
      {formData.subject && (
        <div style={{ marginBottom: '16px' }}>
          <DescriptionList>
            <DescriptionListGroup>
              <Title headingLevel="h3" size="md">
                {formData.subject.kind}
              </Title>
              <DescriptionListDescription>
                <div style={{ margin: '0 16px' }}>{identityDisplay}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>
      )}
      <Divider style={{ margin: '16px 0' }} />
      <div style={{ marginBottom: '16px' }}>
        <DescriptionList>
          <DescriptionListGroup>
            <Title headingLevel="h3" size="md">
              {t('Scope')}
            </Title>
            <DescriptionListDescription>
              <div style={{ margin: '0 16px' }}>
                {(() => {
                  switch (formData.scopeType) {
                    case 'Global access':
                      return (
                        <div>
                          <div style={{ marginTop: '8px' }}>Global / Applies to all resources registered in ACM</div>
                        </div>
                      )
                    case 'Select cluster sets':
                      return (
                        <>
                          <div>
                            <div>
                              <strong>{t('Cluster sets')}</strong>{' '}
                            </div>
                            <div>{clusterSetsDisplay}</div>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <div>
                              <strong>{t('Clusters')}</strong>{' '}
                            </div>
                            <div>
                              {hasNoClusterSets
                                ? clustersDisplay
                                : t('Full access to all clusters in selected cluster sets')}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <strong>{t('Projects')}</strong>
                            <div>{namespacesDisplay}</div>
                          </div>
                        </>
                      )
                    case 'Select clusters':
                      return (
                        <>
                          <div>
                            <strong>{t('Clusters')}:</strong> {clustersDisplay}
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <strong>{t('Projects')}:</strong> {namespacesDisplay}
                          </div>
                        </>
                      )
                    default:
                      return null
                  }
                })()}
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
      <Divider style={{ margin: '16px 0' }} />
      <div style={{ marginBottom: '16px' }}>
        <DescriptionList>
          <DescriptionListGroup>
            <Title headingLevel="h3" size="md">
              {t('Role')}
            </Title>
            <DescriptionListDescription>
              <div style={{ margin: '0 16px' }}>{roleDisplay}</div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
    </div>
  )
}
