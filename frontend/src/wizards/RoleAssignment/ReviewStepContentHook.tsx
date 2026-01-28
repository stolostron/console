/* Copyright Contributors to the Open Cluster Management project */
import { ArrowRightIcon } from '@patternfly/react-icons'
import { useMemo } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface UseReviewStepContentProps {
  oldData: {
    namespaces?: RoleAssignmentPreselected['namespaces']
    clusterNames: RoleAssignmentPreselected['clusterNames']
    clusterSetNames?: RoleAssignmentPreselected['clusterSetNames']
    role?: string
    subject?: RoleAssignmentPreselected['subject']
  }
  newData: {
    namespaces?: string[]
    clusterNames: RoleAssignmentWizardFormData['selectedClusters']
    clusterSetNames?: RoleAssignmentWizardFormData['selectedClusterSets']
    role?: string
    subject?: RoleAssignmentWizardFormData['subject']
  }
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
}

export const useReviewStepContent = ({ oldData, newData, isEditing }: UseReviewStepContentProps) => {
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
    () =>
      oldData.clusterNames && oldData.clusterNames.length > 0
        ? oldData.clusterNames.toSorted((a, b) => a.localeCompare(b)).join(', ')
        : null,
    [oldData.clusterNames]
  )

  const currentClusterNames = useMemo(
    () =>
      newData.clusterNames && newData.clusterNames.length > 0
        ? newData.clusterNames
            .map((c) => c.metadata?.name || c.name || c)
            .toSorted((a, b) => a.localeCompare(b))
            .join(', ')
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

    if (!hasOriginalNamespaces && !hasCurrentNamespaces) {
      return t('Full access')
    }

    const namespacesChanged =
      hasOriginalNamespaces !== hasCurrentNamespaces ||
      (hasOriginalNamespaces &&
        hasCurrentNamespaces &&
        JSON.stringify(oldData.namespaces?.toSorted((a, b) => a.localeCompare(b))) !==
          JSON.stringify(newData.namespaces?.toSorted((a, b) => a.localeCompare(b))))
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
    const current = currentClusterNames || (!isEditing && originalClusterNames) || t('None selected')

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
  }, [originalClusterNames, currentClusterNames, t, isEditing])

  const clusterSetsDisplay = useMemo(() => {
    const getClusterSetNames = (clusterSets: any) => {
      if (!clusterSets || clusterSets.length === 0) return null
      return clusterSets
        .map((cs: any) => cs.metadata?.name || cs)
        .toSorted((a: string, b: string) => a.localeCompare(b))
        .join(', ')
    }

    const originalClusterSetNames = getClusterSetNames(oldData.clusterSetNames)
    const currentClusterSetNames = getClusterSetNames(newData.clusterSetNames)

    const original = originalClusterSetNames || t('None selected')
    const current = currentClusterSetNames || (!isEditing && originalClusterSetNames) || t('None selected')

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
  }, [oldData.clusterSetNames, newData.clusterSetNames, t, isEditing])

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

  const identityDisplay = useMemo(() => {
    const getIdentityValue = (subject?: { kind?: string; user?: string[]; group?: string[]; value?: string }) => {
      if (!subject) return t('Not selected')

      switch (true) {
        case !!subject.value:
          return subject.value
        case subject.kind === 'User' && !!subject.user?.[0]:
          return subject.user[0]
        case subject.kind === 'Group' && !!subject.group?.[0]:
          return subject.group[0]
        default:
          return t('Not selected')
      }
    }

    const original = getIdentityValue(oldData.subject)
    const current = getIdentityValue(newData.subject)

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
  }, [oldData.subject, newData.subject, t, isEditing])

  return { clusterNames, clustersDisplay, clusterSetsDisplay, namespacesDisplay, roleDisplay, identityDisplay }
}
