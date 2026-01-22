/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Divider,
  Title,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { ManagedClusterSet } from '../../resources'
import { GranularityStepContent } from './GranularityStepContent'
import { useReviewStepContent } from './ReviewStepContentHook'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface ReviewStepContentProps {
  formData: RoleAssignmentWizardFormData
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
}

export const ReviewStepContent = ({ formData, preselected, isEditing }: ReviewStepContentProps) => {
  const { t } = useTranslation()

  const { clusterNames, clustersDisplay, namespacesDisplay, roleDisplay } = useReviewStepContent({
    oldData: {
      clusterNames: preselected?.clusterNames,
      namespaces: preselected?.namespaces,
      role: preselected?.roles?.[0],
    },
    newData: {
      clusterNames: formData.selectedClusters,
      namespaces: formData.scope.namespaces,
      role: formData.roles?.[0],
    },
    isEditing,
  })

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
                {(() => {
                  switch (formData.scopeType) {
                    case 'Global access':
                      return <div>{t('All clusters')}</div>
                    case 'Select cluster sets':
                      return (
                        <>
                          <div>
                            <div>
                              <strong>{t('Cluster sets')}</strong>{' '}
                            </div>
                            <div>
                              {formData.selectedClusterSets && formData.selectedClusterSets.length > 0
                                ? formData.selectedClusterSets
                                    .map((cs) => (cs as ManagedClusterSet).metadata?.name || (cs as string))
                                    .join(', ')
                                : t('None selected')}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <div>
                              <strong>{clusterNames ? t('Clusters') : t('Access level')}</strong>{' '}
                            </div>
                            <div>
                              {clusterNames
                                ? clustersDisplay
                                : t('Full access to all clusters in selected cluster sets')}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <strong>{t('Projects')}</strong> {namespacesDisplay}
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
