/* Copyright Contributors to the Open Cluster Management project */
import { TFunction } from 'react-i18next'
import { ManagedClusterSetBinding, MulticlusterRoleAssignmentNamespace, UserKind } from '../../../resources'
import { findManagedClusterSetBinding } from '../../../resources/clients/managed-cluster-set-binding-client'
import { PlacementClusters } from '../../../resources/clients/model/placement-clusters'
import { RoleAssignmentToSave } from '../../../resources/clients/model/role-assignment-to-save'
import {
  addRoleAssignment,
  findRoleAssignments,
  getPlacementsForRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { Subject } from '../../../resources/kubernetes-client'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { Placement } from '../../../resources/placement'
import { IAlertContext } from '../../../ui-components'
import { RoleAssignmentFormDataType } from './hook/RoleAssignmentFormDataHook'

/**
 * Converts form data from the role assignment form into an array of RoleAssignmentToSave objects.
 * Creates one RoleAssignmentToSave for each combination of role and subject name.
 *
 * @param data - The form data containing subject info, scope, and roles
 * @returns Array of RoleAssignmentToSave objects ready to be saved
 */
export const dataToRoleAssignmentToSave = (data: RoleAssignmentFormDataType): RoleAssignmentToSave[] => {
  const subjectNames = data.subject.kind === UserKind ? data.subject.user || [] : data.subject.group || []

  return data.roles.reduce<RoleAssignmentToSave[]>(
    (acc, role) => [
      ...acc,
      ...subjectNames.map((subjectName) => ({
        clusterRole: role,
        clusterNames: data.scope.clusterNames,
        clusterSetNames: [], // TODO: on the new wizard
        targetNamespaces: data.scope.namespaces,
        subject: {
          name: subjectName,
          kind: data.subject.kind,
        },
      })),
    ],
    []
  )
}

/**
 * Finds existing role assignments for the given subjects and creates a lookup map
 * keyed by "kind|name" of the subject for quick access to the related MulticlusterRoleAssignment.
 *
 * @param roleAssignmentsToSave - Array of role assignments to save (used to extract subject names)
 * @param subjectKind - The kind of subject (User, Group, or ServiceAccount)
 * @param multiClusterRoleAssignments - All multicluster role assignments to search through
 * @param placementClusters - PlacementClusters for the placements together with the clusters and cluster sets
 * @returns Map where key is "subjectKind|subjectName" and value is the related MulticlusterRoleAssignment
 */
export const existingRoleAssignmentsBySubjectRole = (
  roleAssignmentsToSave: RoleAssignmentToSave[],
  subjectKind: Subject['kind'],
  multiClusterRoleAssignments: MulticlusterRoleAssignment[],
  placementClusters: PlacementClusters[]
): Map<string, MulticlusterRoleAssignment> => {
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
    acc.set(key, ra.relatedMulticlusterRoleAssignment)
    return acc
  }, new Map<string, MulticlusterRoleAssignment>())
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
  existingBySubjectRole: Map<string, MulticlusterRoleAssignment>,
  managedClusterSetBindings: ManagedClusterSetBinding[],
  placementClusters: PlacementClusters[],
  callbacks: {
    onSuccess: (role: string) => void
    onError: (role: string, error: unknown, isDuplicateError: boolean) => void
  }
): Promise<void> => {
  const lookupKey = `${roleAssignment.subject.kind}|${roleAssignment.subject.name}`
  const existingMulticlusterRoleAssignment = existingBySubjectRole.get(lookupKey)
  const existingManagedClusterSetBindings = findManagedClusterSetBinding(managedClusterSetBindings, {
    clusterSets: roleAssignment.clusterSetNames,
    namespaces: [MulticlusterRoleAssignmentNamespace],
  })
  const existingPlacements: Placement[] = getPlacementsForRoleAssignment(roleAssignment, placementClusters)

  return addRoleAssignment(roleAssignment, {
    existingMulticlusterRoleAssignment,
    existingManagedClusterSetBindings,
    existingPlacements,
  })
    .then(() => callbacks.onSuccess(roleAssignment.clusterRole))
    .catch((e) => {
      const isDuplicateError = e?.message?.includes('Duplicate role assignment detected')
      callbacks.onError(roleAssignment.clusterRole, e, isDuplicateError)
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
  existingBySubjectRole: Map<string, MulticlusterRoleAssignment>,
  managedClusterSetBindings: ManagedClusterSetBinding[],
  placementClusters: PlacementClusters[],
  toastContext: IAlertContext,
  t: TFunction
): Promise<void> => {
  await Promise.all(
    roleAssignmentsToSave.map((roleAssignment) =>
      saveRoleAssignment(roleAssignment, existingBySubjectRole, managedClusterSetBindings, placementClusters, {
        onSuccess: (role) =>
          toastContext.addAlert({
            title: t('Role assignment added'),
            message: t('A role assignment for {{role}} role added.', { role }),
            type: 'success',
            autoClose: true,
          }),
        onError: (role, error, isDuplicateError) =>
          toastContext.addAlert({
            title: t('Role assignment creation failed'),
            message: isDuplicateError
              ? t('This role assignment already exists. Please modify the selection to create a unique assignment.')
              : t('The role assignment creation for {{role}} role failed. Error: {{error}}', { role, error }),
            type: 'danger',
            autoClose: true,
          }),
      })
    )
  )
}
