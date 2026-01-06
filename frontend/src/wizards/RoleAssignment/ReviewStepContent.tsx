/* Copyright Contributors to the Open Cluster Management project */
import { DescriptionList, DescriptionListGroup, DescriptionListDescription, Title } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { RoleAssignmentWizardFormData } from './types'
import { GranularityStepContent } from './GranularityStepContent'
import { Divider } from '@patternfly/react-core'

interface ReviewStepContentProps {
  formData: RoleAssignmentWizardFormData
}

export const ReviewStepContent = ({ formData }: ReviewStepContentProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <GranularityStepContent title={t('Review')} titleSize="lg" description={''} />
      {formData.subject && (
        <div style={{ marginBottom: '16px' }}>
          <DescriptionList>
            <DescriptionListGroup>
              <Title headingLevel="h3" size="md">
                {formData.subject.kind}
              </Title>
              <DescriptionListDescription>
                <div style={{ margin: '0 16px' }}>
                  <strong>
                    {formData.subject.kind === 'User'
                      ? formData.subject.user?.join(', ') || t('Not selected')
                      : formData.subject.group?.join(', ') || t('Not selected')}
                  </strong>
                </div>
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
                {formData.scopeType === 'Global access' && <div>{t('All clusters')}</div>}
                {formData.scopeType === 'Select cluster sets' && (
                  <>
                    <div>
                      <div>
                        <strong>{t('Cluster sets')}</strong>{' '}
                      </div>
                      <div>
                        {formData.selectedClusterSets && formData.selectedClusterSets.length > 0
                          ? formData.selectedClusterSets.map((cs) => cs.metadata?.name || cs).join(', ')
                          : t('None selected')}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div>
                        <strong>
                          {formData.selectedClusters && formData.selectedClusters.length > 0
                            ? t('Clusters')
                            : t('Access level')}
                        </strong>{' '}
                      </div>
                      <div>
                        {formData.selectedClusters && formData.selectedClusters.length > 0
                          ? formData.selectedClusters.map((c) => c.name).join(', ')
                          : t('Full access to all clusters in selected cluster sets')}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div>
                        <strong>{t('Projects')}</strong>{' '}
                      </div>
                      <div>
                        {formData.scope.namespaces && formData.scope.namespaces.length > 0
                          ? formData.scope.namespaces.join(', ')
                          : t('Full access')}
                      </div>
                    </div>
                  </>
                )}
                {formData.scopeType === 'Select clusters' && (
                  <>
                    <div>
                      <strong>{t('Clusters')}:</strong>{' '}
                      {formData.selectedClusters && formData.selectedClusters.length > 0
                        ? formData.selectedClusters.map((c) => c.name).join(', ')
                        : t('None selected')}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <strong>{t('Projects')}:</strong>{' '}
                      {formData.scope.namespaces && formData.scope.namespaces.length > 0
                        ? formData.scope.namespaces.join(', ')
                        : t('Full access')}
                    </div>
                  </>
                )}
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
              <div style={{ margin: '0 16px' }}>
                <strong>
                  {formData.roles && formData.roles.length > 0 ? formData.roles[0] : t('No role selected')}
                </strong>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
    </div>
  )
}
