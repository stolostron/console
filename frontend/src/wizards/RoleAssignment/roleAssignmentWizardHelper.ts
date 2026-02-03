/* Copyright Contributors to the Open Cluster Management project */
import { UserKind } from '../../resources'
import { RoleAssignmentToSave } from '../../resources/clients/model/role-assignment-to-save'
import { RoleAssignmentWizardFormData } from './types'

const getClusterNames = (data: RoleAssignmentWizardFormData, allClusterNames: string[]): string[] | undefined => {
  if (data.scope.kind === 'all') {
    return allClusterNames
  } else if (data.selectedClusters?.[0]) {
    return data.selectedClusters.map((cluster: any) => cluster.metadata?.name || cluster.name || cluster)
  }
}
const getClusterSetNames = (data: RoleAssignmentWizardFormData): string[] | undefined => {
  if (data.selectedClusters?.[0]) {
    return undefined
  }
  return data.scopeType === 'Select cluster sets' && data.selectedClusterSets
    ? data.selectedClusterSets.map((clusterSet: any) => clusterSet.metadata?.name || clusterSet.name || clusterSet)
    : undefined
}
export const wizardDataToRoleAssignmentToSave = (
  data: RoleAssignmentWizardFormData,
  allClusterNames: string[]
): RoleAssignmentToSave[] => {
  const isGlobalScope = data.scopeType === 'Global access'
  const subjectNames = (data.subject.kind === UserKind ? data.subject.user : data.subject.group) || []
  const clusterNames = isGlobalScope ? undefined : getClusterNames(data, allClusterNames)
  const clusterSetNames = isGlobalScope ? undefined : getClusterSetNames(data)

  const targetNamespaces = data.scope?.namespaces

  return data.roles.reduce<RoleAssignmentToSave[]>(
    (acc, role) => [
      ...acc,
      ...subjectNames.map((subjectName) => ({
        clusterRole: role,
        isGlobalScope,
        clusterNames,
        clusterSetNames,
        targetNamespaces,
        subject: {
          name: subjectName,
          kind: data.subject.kind,
        },
      })),
    ],
    []
  )
}
