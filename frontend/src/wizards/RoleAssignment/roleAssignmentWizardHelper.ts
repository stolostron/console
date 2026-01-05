/* Copyright Contributors to the Open Cluster Management project */
import { UserKind } from '../../resources'
import { RoleAssignmentToSave } from '../../resources/clients/model/role-assignment-to-save'
import { RoleAssignmentWizardFormData } from './types'

export const wizardDataToRoleAssignmentToSave = (
  data: RoleAssignmentWizardFormData,
  allClusterNames: string[]
): RoleAssignmentToSave[] => {
  const subjectNames = data.subject.kind === UserKind ? data.subject.user || [] : data.subject.group || []

  let clusterNames: string[] | undefined
  if (data.scope.kind === 'all') {
    clusterNames = allClusterNames
  } else if (data.scopeType === 'Select clusters' && data.selectedClusters) {
    clusterNames = data.selectedClusters.map((cluster: any) => cluster.metadata?.name || cluster.name || cluster)
  }

  let clusterSetNames: string[] | undefined = []
  if (data.scopeType === 'Select cluster sets' && data.selectedClusterSets) {
    clusterSetNames = data.selectedClusterSets.map(
      (clusterSet: any) => clusterSet.metadata?.name || clusterSet.name || clusterSet
    )
  }

  const targetNamespaces = data.scope.namespaces

  return data.roles.reduce<RoleAssignmentToSave[]>(
    (acc, role) => [
      ...acc,
      ...subjectNames.map((subjectName) => ({
        clusterRole: role,
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
