/* Copyright Contributors to the Open Cluster Management project */
import { ExpandableSection, ExpandableSectionVariant, Grid, GridItem } from '@patternfly/react-core'
import { ArrowRightIcon } from '@patternfly/react-icons'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentWizardFormData, RoleAssignmentWizardModalProps } from './types'

interface UseReviewStepContentProps {
  oldData: {
    namespaces: string[]
    clusterSetNames?: RoleAssignmentPreselected['clusterSetNames']
    clusterNames: string[]
    role?: string
    subject?: RoleAssignmentPreselected['subject']
  }
  newData: {
    namespaces: string[]
    clusterSetNames?: RoleAssignmentWizardFormData['selectedClusterSets']
    clusterNames: string[]
    role?: string
    subject?: RoleAssignmentWizardFormData['subject']
  }
  preselected?: RoleAssignmentWizardModalProps['preselected']
  isEditing?: boolean
}

type ExpandableSections =
  | 'clusters-original'
  | 'clusters-current'
  | 'clustersets-original'
  | 'clustersets-current'
  | 'namespaces-original'
  | 'namespaces-current'
  | 'role-original'
  | 'role-current'
  | 'identity-original'
  | 'identity-current'

const BeforeAfterDisplay = ({
  original,
  current,
  showComparison,
  onToggleOriginalCallback,
  onToggleCurrentCallback,
  isOriginalExpanded,
  isCurrentExpanded,
}: {
  original: string
  current: string
  showComparison: boolean
  onToggleOriginalCallback: () => void
  onToggleCurrentCallback: () => void
  isOriginalExpanded: boolean
  isCurrentExpanded: boolean
}) => {
  return showComparison ? (
    <Grid>
      <GridItem span={3}>
        <s>
          <ExpandableSection
            variant={ExpandableSectionVariant.truncate}
            toggleText={isOriginalExpanded ? 'Show less' : 'Show more'}
            onToggle={onToggleOriginalCallback}
            isExpanded={isOriginalExpanded}
          >
            {original}
          </ExpandableSection>
        </s>
      </GridItem>
      <GridItem span={1} style={{ textAlign: 'center' }}>
        <ArrowRightIcon />
      </GridItem>
      <GridItem span={8}>
        <ExpandableSection
          variant={ExpandableSectionVariant.truncate}
          toggleText={isCurrentExpanded ? 'Show less' : 'Show more'}
          onToggle={onToggleCurrentCallback}
          isExpanded={isCurrentExpanded}
        >
          {current}
        </ExpandableSection>
      </GridItem>
    </Grid>
  ) : (
    <ExpandableSection
      variant={ExpandableSectionVariant.truncate}
      toggleText={isOriginalExpanded ? 'Show less' : 'Show more'}
      onToggle={onToggleOriginalCallback}
      isExpanded={isOriginalExpanded}
    >
      {current}
    </ExpandableSection>
  )
}

export const useReviewStepContent = ({ oldData, newData, isEditing }: UseReviewStepContentProps) => {
  const { t } = useTranslation()
  const [expandableSections, setExpandableSections] = useState<Record<ExpandableSections, boolean>>(
    {} as Record<ExpandableSections, boolean>
  )

  const onToggleExpandableSection = useCallback(
    (section: ExpandableSections) =>
      setExpandableSections((prev: Record<ExpandableSections, boolean>) => ({ ...prev, [section]: !prev[section] })),
    []
  )

  const getClusterNames = ({
    selectedClusters,
    clusterNames,
  }: {
    selectedClusters: RoleAssignmentWizardFormData['selectedClusters']
    clusterNames: RoleAssignmentPreselected['clusterNames']
  }): string | null => {
    switch (true) {
      case selectedClusters && selectedClusters.length > 0:
        return selectedClusters.join(', ')
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
        ? newData.clusterNames.toSorted((a, b) => a.localeCompare(b)).join(', ')
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

  const originalNamespaces = useMemo(
    () => (oldData.namespaces.length ? oldData.namespaces.join(', ') : t('Full access')),
    [oldData.namespaces, t]
  )

  const currentNamespaces = useMemo(
    () => (newData.namespaces.length ? newData.namespaces.join(', ') : t('Full access')),
    [newData.namespaces, t]
  )

  const namespacesDisplay = useMemo(() => {
    const hasOriginalNamespaces = oldData.namespaces.length > 0
    const hasCurrentNamespaces = newData.namespaces.length > 0

    if (!hasOriginalNamespaces && !hasCurrentNamespaces) {
      return t('Full access')
    }

    const namespacesChanged =
      hasOriginalNamespaces !== hasCurrentNamespaces ||
      (hasOriginalNamespaces &&
        hasCurrentNamespaces &&
        JSON.stringify(oldData.namespaces.toSorted((a, b) => a.localeCompare(b))) !==
          JSON.stringify(newData.namespaces.toSorted((a, b) => a.localeCompare(b))))

    const original: string = originalNamespaces
    const current: string = currentNamespaces

    return (
      <BeforeAfterDisplay
        original={original}
        current={current}
        showComparison={isEditing === true && namespacesChanged === true}
        onToggleOriginalCallback={() => onToggleExpandableSection('namespaces-original')}
        onToggleCurrentCallback={() => onToggleExpandableSection('namespaces-current')}
        isOriginalExpanded={expandableSections['namespaces-original']}
        isCurrentExpanded={expandableSections['namespaces-current']}
      />
    )
  }, [
    oldData.namespaces,
    newData.namespaces,
    originalNamespaces,
    currentNamespaces,
    isEditing,
    expandableSections,
    onToggleExpandableSection,
    t,
  ])

  const clustersDisplay = useMemo(() => {
    const original: string = originalClusterNames || t('None selected')
    const current: string = currentClusterNames || (!isEditing && originalClusterNames) || t('None selected')
    return (
      <BeforeAfterDisplay
        original={original}
        current={current}
        showComparison={isEditing === true && original !== current}
        onToggleOriginalCallback={() => onToggleExpandableSection('clusters-original')}
        onToggleCurrentCallback={() => onToggleExpandableSection('clusters-current')}
        isOriginalExpanded={expandableSections['clusters-original']}
        isCurrentExpanded={expandableSections['clusters-current']}
      />
    )
  }, [originalClusterNames, t, currentClusterNames, isEditing, expandableSections, onToggleExpandableSection])

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

    return (
      <BeforeAfterDisplay
        original={original}
        current={current}
        showComparison={isEditing === true && original !== current}
        onToggleOriginalCallback={() => onToggleExpandableSection('clustersets-original')}
        onToggleCurrentCallback={() => onToggleExpandableSection('clustersets-current')}
        isOriginalExpanded={expandableSections['clustersets-original']}
        isCurrentExpanded={expandableSections['clustersets-current']}
      />
    )
  }, [oldData.clusterSetNames, newData.clusterSetNames, t, isEditing, expandableSections, onToggleExpandableSection])

  const roleDisplay = useMemo(() => {
    const original: string = oldData.role ?? t('No role selected')
    const current: string = newData.role ?? t('No role selected')

    return (
      <BeforeAfterDisplay
        original={original}
        current={current}
        showComparison={isEditing === true && original !== current}
        onToggleOriginalCallback={() => onToggleExpandableSection('role-original')}
        onToggleCurrentCallback={() => onToggleExpandableSection('role-current')}
        isOriginalExpanded={expandableSections['role-original']}
        isCurrentExpanded={expandableSections['role-current']}
      />
    )
  }, [oldData.role, t, newData.role, isEditing, expandableSections, onToggleExpandableSection])

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

    return (
      <BeforeAfterDisplay
        original={original}
        current={current}
        showComparison={isEditing === true && original !== current}
        onToggleOriginalCallback={() => onToggleExpandableSection('identity-original')}
        onToggleCurrentCallback={() => onToggleExpandableSection('identity-current')}
        isOriginalExpanded={expandableSections['identity-original']}
        isCurrentExpanded={expandableSections['identity-current']}
      />
    )
  }, [oldData.subject, newData.subject, isEditing, expandableSections, t, onToggleExpandableSection])

  return { clusterNames, clusterSetsDisplay, clustersDisplay, namespacesDisplay, roleDisplay, identityDisplay }
}
