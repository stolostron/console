/* Copyright Contributors to the Open Cluster Management project */
import { ArrowRightIcon } from '@patternfly/react-icons'
import { useMemo } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface useReviewStepContentProps {
  oldData: {
    namespaces?: RoleAssignmentPreselected['namespaces']
    clusterNames: RoleAssignmentPreselected['clusterNames']
    role?: string
  }
  newData: {
    namespaces?: string[]
    clusterNames: RoleAssignmentWizardFormData['selectedClusters']
    role?: string
  }
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
}

export const useReviewStepContent = ({ oldData, newData, isEditing }: useReviewStepContentProps) => {
  const { t } = useTranslation()

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

  const originalClusterNames = useMemo(
    () => (oldData.clusterNames && oldData.clusterNames.length > 0 ? oldData.clusterNames.join(', ') : null),
    [oldData.clusterNames]
  )

  const currentClusterNames = useMemo(
    () =>
      newData.clusterNames && newData.clusterNames.length > 0
        ? newData.clusterNames.map((c) => c.metadata?.name || c.name || c).join(', ')
        : null,
    [newData.clusterNames]
  )

  const clusterNames = useMemo(
    () =>
      getClusterNames({
        selectedClusters: newData.clusterNames,
        clusterNames: oldData.clusterNames,
      }),
    [newData.clusterNames, oldData.clusterNames]
  )

  const namespacesDisplay = useMemo(() => {
    const hasOriginalNamespaces = oldData.namespaces && oldData.namespaces.length > 0
    const hasCurrentNamespaces = newData.namespaces && newData.namespaces.length > 0
    const namespacesChanged =
      hasOriginalNamespaces !== hasCurrentNamespaces ||
      (hasOriginalNamespaces &&
        hasCurrentNamespaces &&
        JSON.stringify(oldData.namespaces?.sort()) !== JSON.stringify(newData.namespaces?.sort()))
    if (!isEditing || !namespacesChanged) {
      return hasCurrentNamespaces ? newData.namespaces!.join(', ') : t('Full access')
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>
          <s>{hasOriginalNamespaces ? oldData.namespaces!.join(', ') : t('Full access')}</s>
        </div>
        <ArrowRightIcon />
        <div>
          <strong>{hasCurrentNamespaces ? newData.namespaces!.join(', ') : t('Full access')}</strong>
        </div>
      </div>
    )
  }, [oldData.namespaces, newData.namespaces, t, isEditing])

  const clustersDisplay = useMemo(() => {
    const original = originalClusterNames || t('None selected')
    const current = currentClusterNames || oldData.clusterNames?.join(', ') || t('None selected')

    return !isEditing || original === current ? (
      current
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>
          <s>{original}</s>
        </div>
        <ArrowRightIcon />
        <div>
          <strong>{current}</strong>
        </div>
      </div>
    )
  }, [originalClusterNames, currentClusterNames, oldData.clusterNames, t, isEditing])

  const roleDisplay = useMemo(() => {
    const original = oldData.role ?? t('No role selected')
    const current = newData.role ?? t('No role selected')

    return !isEditing || original === current ? (
      current
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div>
          <s>{original}</s>
        </div>
        <ArrowRightIcon />
        <div>
          <strong>{current}</strong>
        </div>
      </div>
    )
  }, [oldData.role, newData.role, t, isEditing])

  return { clusterNames, clustersDisplay, namespacesDisplay, roleDisplay }
}
