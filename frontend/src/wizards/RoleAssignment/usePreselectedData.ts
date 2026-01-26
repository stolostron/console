/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useRef } from 'react'
import { GroupKind, UserKind } from '../../resources'
import { useRoleAssignmentData } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { RoleAssignmentWizardFormData } from './types'

interface UsePreselectedDataProps {
  isOpen: boolean
  preselected?: RoleAssignmentPreselected
  setFormData: React.Dispatch<React.SetStateAction<RoleAssignmentWizardFormData>>
  setSelectedClusterSets: React.Dispatch<React.SetStateAction<any[]>>
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
  setSelectedClusterSets,
  setSelectedClusters,
}: UsePreselectedDataProps) => {
  const { roleAssignmentData } = useRoleAssignmentData()
  const hasAppliedPreselection = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      hasAppliedPreselection.current = false
    } else if (!hasAppliedPreselection.current) {
      hasAppliedPreselection.current = true

      const allClusters = roleAssignmentData.clusterSets?.flatMap((cs) => cs.clusters ?? []) ?? []

      setFormData((prev) => {
        const updates: Partial<RoleAssignmentWizardFormData> = {}

        const subjectUpdate = buildSubjectUpdate(preselected?.subject)
        if (subjectUpdate) {
          updates.subject = subjectUpdate
        }

        if (preselected?.roles && preselected.roles.length > 0) {
          updates.roles = preselected.roles
        }

        if (preselected?.clusterSetNames && preselected.clusterSetNames.length > 0) {
          const clusterSetNames = roleAssignmentData.clusterSets
            .map((e) => e.name)
            .filter((clusterSetName) => preselected.clusterSetNames?.includes(clusterSetName))

          updates.scopeType = 'Select cluster sets'
          updates.scope = {
            kind: 'all',
          }
          updates.selectedClusterSets = clusterSetNames
          setSelectedClusterSets(clusterSetNames)
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
    }
  }, [isOpen, preselected, roleAssignmentData.clusterSets, setFormData, setSelectedClusterSets, setSelectedClusters])
}
