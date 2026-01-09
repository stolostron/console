/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Divider,
  Title,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { GranularityStepContent } from './GranularityStepContent'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface ReviewStepContentProps {
  formData: RoleAssignmentWizardFormData
  preselected?: RoleAssignmentWizardModalProps['preselected']
}

export const ReviewStepContent = ({ formData, preselected }: ReviewStepContentProps) => {
  const { t } = useTranslation()

  const getClusterNames = () => {
    if (formData.selectedClusters && formData.selectedClusters.length > 0) {
      return formData.selectedClusters.map((c) => c.metadata?.name || c.name || c).join(', ')
    }
    if (preselected?.clusterNames && preselected.clusterNames.length > 0) {
      return preselected.clusterNames.join(', ')
    }
    return null
  }

  const clusterNames = getClusterNames()

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
                        <strong>{clusterNames ? t('Clusters') : t('Access level')}</strong>{' '}
                      </div>
                      <div>{clusterNames || t('Full access to all clusters in selected cluster sets')}</div>
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
                      <strong>{t('Clusters')}:</strong> {clusterNames || t('None selected')}
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
