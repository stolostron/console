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
import { useMemo } from 'react'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { ManagedClusterSet } from '../../resources'
import { ArrowRightIcon } from '@patternfly/react-icons'

interface ReviewStepContentProps {
  formData: RoleAssignmentWizardFormData
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
}

export const ReviewStepContent = ({ formData, preselected, isEditing }: ReviewStepContentProps) => {
  const { t } = useTranslation()

  const namespacesDisplay = useMemo(() => {
    const hasOriginalNamespaces = preselected?.namespaces && preselected.namespaces.length > 0
    const hasCurrentNamespaces = formData.scope.namespaces && formData.scope.namespaces.length > 0
    const namespacesChanged =
      hasOriginalNamespaces !== hasCurrentNamespaces ||
      (hasOriginalNamespaces &&
        hasCurrentNamespaces &&
        JSON.stringify(preselected?.namespaces?.sort()) !== JSON.stringify(formData.scope.namespaces?.sort()))

    if (!isEditing || !namespacesChanged) {
      return hasCurrentNamespaces ? formData.scope.namespaces!.join(', ') : t('Full access')
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>{hasOriginalNamespaces ? preselected.namespaces!.join(', ') : t('Full access')}</div>
        <ArrowRightIcon />
        <div>{hasCurrentNamespaces ? formData.scope.namespaces!.join(', ') : t('Full access')}</div>
      </div>
    )
  }, [preselected?.namespaces, formData.scope.namespaces, t, isEditing])

  const getClusterNames = ({
    selectedClusters,
    clusterNames,
  }: {
    selectedClusters: RoleAssignmentWizardFormData['selectedClusters']
    clusterNames: RoleAssignmentPreselected['clusterNames']
  }): string | null => {
    switch (true) {
      case selectedClusters && selectedClusters.length > 0:
        return selectedClusters.map((c) => c.metadata?.name || c.name || c).join(', ')
      case clusterNames && clusterNames.length > 0:
        return clusterNames.join(', ')
      default:
        return null
    }
  }

  const originalClusterNames = useMemo(() => {
    return preselected?.clusterNames && preselected.clusterNames.length > 0 ? preselected.clusterNames.join(', ') : null
  }, [preselected?.clusterNames])

  const currentClusterNames = useMemo(() => {
    return formData.selectedClusters && formData.selectedClusters.length > 0
      ? formData.selectedClusters.map((c) => c.metadata?.name || c.name || c).join(', ')
      : null
  }, [formData.selectedClusters])

  const clusterNames = useMemo(
    () =>
      getClusterNames({
        selectedClusters: formData.selectedClusters,
        clusterNames: preselected?.clusterNames,
      }),
    [formData.selectedClusters, preselected?.clusterNames]
  )

  const clustersDisplay = useMemo(() => {
    const original = originalClusterNames || t('None selected')
    const current = currentClusterNames || t('None selected')

    if (!isEditing || original === current) {
      return current
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>{original}</div>
        <ArrowRightIcon />
        <div>{current}</div>
      </div>
    )
  }, [originalClusterNames, currentClusterNames, t, isEditing])

  const roleDisplay = useMemo(() => {
    const original = preselected?.roles?.[0] ?? t('No role selected')
    const current = formData.roles?.[0] ?? t('No role selected')

    if (!isEditing || original === current) {
      return current
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>{original}</div>
        <ArrowRightIcon />
        <div>{current}</div>
      </div>
    )
  }, [preselected?.roles, formData.roles, t, isEditing])

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
              <div style={{ margin: '0 16px' }}>
                <strong>{roleDisplay}</strong>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
    </div>
  )
}
