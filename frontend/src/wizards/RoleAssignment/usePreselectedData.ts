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

const buildSubjectUpdate = (subject: RoleAssignmentPreselected['subject']) =>
  subject
    ? {
        kind: subject.kind,
        user: subject.kind === UserKind && subject.value ? [subject.value] : undefined,
        group: subject.kind === GroupKind && subject.value ? [subject.value] : undefined,
      }
    : undefined

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

      const subjectUpdate = buildSubjectUpdate(preselected?.subject)
      if (subjectUpdate) {
        updates.subject = subjectUpdate
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
