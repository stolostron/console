/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useRef } from 'react'
import { GlobalPlacementName, GroupKind, UserKind } from '../../resources'
import { useRoleAssignmentData } from '../../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
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
  const { managedClusterSetsState } = useSharedAtoms()
  const managedClusterSets = useRecoilValue(managedClusterSetsState)
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

        const hasClusterSetNames: boolean =
          preselected?.clusterSetNames !== undefined && preselected.clusterSetNames.length > 0
        const isGlobalAccess: boolean =
          hasClusterSetNames && preselected!.clusterSetNames!.includes(GlobalPlacementName)
        const hasClusters: boolean = preselected?.clusterNames !== undefined && preselected.clusterNames.length > 0
        const hasNamespaces: boolean = preselected?.namespaces !== undefined && preselected.namespaces.length > 0

        if (isGlobalAccess) {
          updates.scopeType = 'Global access'
          updates.scope = {
            kind: 'all',
          }
        } else if (hasClusterSetNames) {
          const clusterSets = managedClusterSets.filter(
            (clusterSet) => clusterSet.metadata.name && preselected?.clusterSetNames?.includes(clusterSet.metadata.name)
          )

          updates.scopeType = 'Select cluster sets'
          updates.scope = {
            kind: 'all',
          }
          updates.selectedClusterSets = clusterSets.map((clusterSet) => clusterSet.metadata.name!)
          setSelectedClusterSets(clusterSets)
        } else if (hasClusters) {
          const clusterObjects = allClusters.filter((cluster) => preselected?.clusterNames?.includes(cluster.name))

          updates.scopeType = 'Select clusters'
          updates.scope = {
            kind: 'specific',
            clusterNames: preselected?.clusterNames,
          }
          updates.selectedClusters = clusterObjects
          setSelectedClusters(clusterObjects)
        }

        if (hasNamespaces) {
          updates.scope = {
            kind: updates.scope?.kind ?? 'specific',
            namespaces: preselected?.namespaces,
          }

          if (hasClusters) {
            updates.clustersAccessLevel = 'Project role assignment'
          }

          if (hasClusterSetNames && !isGlobalAccess) {
            updates.clustersetsAccessLevel = 'Project role assignment'
          }
        }

        return { ...prev, ...updates }
      })
    }
  }, [
    isOpen,
    preselected,
    roleAssignmentData.clusterSets,
    managedClusterSets,
    setFormData,
    setSelectedClusterSets,
    setSelectedClusters,
  ])
}
