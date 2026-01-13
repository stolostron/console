/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo } from 'react'
import { UserKind, GroupKind } from '../../resources'
import { RoleAssignmentWizardFormData } from './types'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { useRoleAssignmentData } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'

interface UsePreselectedDataProps {
  isOpen: boolean
  preselected?: RoleAssignmentPreselected
  setFormData: React.Dispatch<React.SetStateAction<RoleAssignmentWizardFormData>>
  setSelectedClusters: React.Dispatch<React.SetStateAction<any[]>>
}

export const usePreselectedData = ({
  isOpen,
  preselected,
  setFormData,
  setSelectedClusters,
}: UsePreselectedDataProps) => {
  const { roleAssignmentData } = useRoleAssignmentData()

  const allClusters = useMemo(
    () => roleAssignmentData.clusterSets?.flatMap((cs) => cs.clusters || []) || [],
    [roleAssignmentData.clusterSets]
  )

  useEffect(() => {
    if (!isOpen) return

    setFormData((prev) => {
      const updates: Partial<RoleAssignmentWizardFormData> = {}

      if (preselected?.subject) {
        updates.subject = {
          kind: preselected.subject.kind,
          user:
            preselected.subject.kind === UserKind && preselected.subject.value
              ? [preselected.subject.value]
              : undefined,
          group:
            preselected.subject.kind === GroupKind && preselected.subject.value
              ? [preselected.subject.value]
              : undefined,
        }
      }

      if (preselected?.roles && preselected.roles.length > 0) {
        updates.roles = preselected.roles
      }

      if (preselected?.clusterNames && preselected.clusterNames.length > 0) {
        const clusterObjects = allClusters.filter((cluster) => preselected.clusterNames?.includes(cluster.name))

        updates.scopeType = 'Select clusters'
        updates.scope = {
          kind: 'specific',
          clusterNames: preselected.clusterNames,
          namespaces: preselected.namespaces,
        }
        updates.selectedClusters = clusterObjects
        setSelectedClusters(clusterObjects)

        if (preselected.namespaces && preselected.namespaces.length > 0) {
          updates.selectedClustersAccessLevel = 'Project role assignment'
        }
      } else if (preselected?.namespaces && preselected.namespaces.length > 0) {
        updates.scope = {
          kind: 'specific',
          namespaces: preselected.namespaces,
        }
      }

      return { ...prev, ...updates }
    })
  }, [preselected, isOpen, setFormData, setSelectedClusters, allClusters])
}
