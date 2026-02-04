/* Copyright Contributors to the Open Cluster Management project */
import { TFunction } from 'react-i18next'
import { ManagedClusterSetBinding, MulticlusterRoleAssignmentNamespace } from '../../../resources'
import { findManagedClusterSetBinding } from '../../../resources/clients/managed-cluster-set-binding-client'
import { PlacementClusters } from '../../../resources/clients/model/placement-clusters'
import { RoleAssignmentToSave } from '../../../resources/clients/model/role-assignment-to-save'
import {
  addRoleAssignment,
  findRoleAssignments,
  getPlacementsForRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { Subject } from '../../../resources/kubernetes-client'
import { MulticlusterRoleAssignment, RoleAssignment } from '../../../resources/multicluster-role-assignment'
import { Placement } from '../../../resources/placement'
import { IAlertContext } from '../../../ui-components'

/**
 * Finds existing role assignments for the given subjects and creates a lookup map
 * keyed by "kind|name" of the subject for quick access to the related MulticlusterRoleAssignment.
 *
 * @param roleAssignmentsToSave - Array of role assignments to save (used to extract subject names)
 * @param subjectKind - The kind of subject (User, Group, or ServiceAccount)
 * @param multiClusterRoleAssignments - All multicluster role assignments to search through
 * @param placementClusters - PlacementClusters for the placements together with the clusters and cluster sets
 * @returns Map where key is "subjectKind|subjectName" and value are the related MulticlusterRoleAssignments
 */
export const existingRoleAssignmentsBySubjectRole = (
  roleAssignmentsToSave: RoleAssignmentToSave[],
  subjectKind: Subject['kind'],
  multiClusterRoleAssignments: MulticlusterRoleAssignment[],
  placementClusters: PlacementClusters[]
): Map<string, MulticlusterRoleAssignment[]> => {
  const subjectNames = roleAssignmentsToSave.map((ra) => ra.subject.name).filter((e): e is string => e !== undefined)

  const existingRoleAssignments = findRoleAssignments(
    {
      subjectKinds: [subjectKind],
      subjectNames,
    },
    multiClusterRoleAssignments,
    placementClusters
  )

  return existingRoleAssignments.reduce((acc, ra) => {
    const key = `${ra.subject.kind}|${ra.subject.name}`
    acc.set(key, [...(acc.get(key) ?? []), ra.relatedMulticlusterRoleAssignment])
    return acc
  }, new Map<string, MulticlusterRoleAssignment[]>())
}

/**
 * Saves a single role assignment, finding existing resources and calling addRoleAssignment.
 * Invokes callbacks on success or error.
 *
 * @param roleAssignment - The role assignment to save
 * @param existingBySubjectRole - Map of existing role assignments by subject key
 * @param managedClusterSetBindings - All managed cluster set bindings to search through
 * @param placements - All placements to search through
 * @param callbacks - Callbacks for success and error handling
 * @returns Promise that resolves when the operation completes
 */
export const saveRoleAssignment = (
  roleAssignment: RoleAssignmentToSave,
  existingBySubjectRole: Map<string, MulticlusterRoleAssignment[]>,
  managedClusterSetBindings: ManagedClusterSetBinding[],
  placementClusters: PlacementClusters[],
  callbacks: {
    onSuccess: (roleAssignment: RoleAssignment) => void
    onError: (role: string, error: unknown, isDuplicateError: boolean) => void
  }
): Promise<RoleAssignment> => {
  const lookupKey = `${roleAssignment.subject.kind}|${roleAssignment.subject.name}`
  const existingMulticlusterRoleAssignments = existingBySubjectRole.get(lookupKey)
  const existingManagedClusterSetBindings = findManagedClusterSetBinding(managedClusterSetBindings, {
    clusterSets: roleAssignment.clusterSetNames,
    namespaces: [MulticlusterRoleAssignmentNamespace],
  })
  const existingPlacements: Placement[] = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

  return addRoleAssignment(roleAssignment, {
    existingMulticlusterRoleAssignments,
    existingManagedClusterSetBindings,
    existingPlacements,
  })
    .then((roleAssignment) => {
      callbacks.onSuccess(roleAssignment)
      return roleAssignment
    })
    .catch((e) => {
      const isDuplicateError = e?.message?.includes('Duplicate role assignment detected')
      callbacks.onError(roleAssignment.clusterRole, e, isDuplicateError)
      throw e
    })
}

/**
 * Saves all role assignments and shows toast notifications for success/error.
 * This is the common save logic used by both RoleAssignmentModal and RoleAssignmentWizardModalWrapper.
 *
 * @param roleAssignmentsToSave - Array of role assignments to save
 * @param existingBySubjectRole - Map of existing role assignments by subject key
 * @param managedClusterSetBindings - All managed cluster set bindings
 * @param placementClusters - PlacementClusters for the placements
 * @param toastContext - Toast context for showing notifications
 * @param t - Translation function
 * @returns Promise that resolves when all operations complete
 */
export const saveAllRoleAssignments = async (
  roleAssignmentsToSave: RoleAssignmentToSave[],
  existingBySubjectRole: Map<string, MulticlusterRoleAssignment[]>,
  managedClusterSetBindings: ManagedClusterSetBinding[],
  placementClusters: PlacementClusters[],
  toastContext: IAlertContext,
  t: TFunction,
  isEditing = false
): Promise<RoleAssignment[]> =>
  await Promise.all(
    roleAssignmentsToSave.map((roleAssignment) =>
      saveRoleAssignment(roleAssignment, existingBySubjectRole, managedClusterSetBindings, placementClusters, {
        onSuccess: (roleAssignment: RoleAssignment) =>
          toastContext.addAlert({
            title: isEditing ? t('Role assignment updated') : t('Role assignment added'),
            message: isEditing
              ? t('A role assignment for {{role}} role updated.', { role: roleAssignment.clusterRole })
              : t('A role assignment for {{role}} role added.', { role: roleAssignment.clusterRole }),
            type: 'success',
            autoClose: true,
          }),
        onError: (role, error, isDuplicateError) => {
          const failureMessage = isEditing
            ? t('The role assignment update for {{role}} role failed. Error: {{error}}', { role, error })
            : t('The role assignment creation for {{role}} role failed. Error: {{error}}', { role, error })

          const errorMessage = isDuplicateError
            ? t('This role assignment already exists. Please modify the selection to create a unique assignment.')
            : failureMessage

          toastContext.addAlert({
            title: isEditing ? t('Role assignment update failed') : t('Role assignment creation failed'),
            message: errorMessage,
            type: 'danger',
            autoClose: true,
          })
        },
      })
    )
  )
