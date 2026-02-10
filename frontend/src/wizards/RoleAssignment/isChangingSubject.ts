/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { GroupKind, UserKind } from '../../resources'

/**
 * True when subject.kind has changed and is different to preselected subject kind.
 */
export const getIsChangingSubjectForKindChange = (
  preselected: RoleAssignmentPreselected | undefined,
  newKind: string
): boolean => preselected?.subject?.kind !== undefined && preselected?.subject?.kind !== newKind

/**
 * True when subject.user has changed and is different to preselected.subject.value,
 * or when preselected subject kind is not User.
 */
export const getIsChangingSubjectForUserChange = (
  preselected: RoleAssignmentPreselected | undefined,
  newUsers: string[]
): boolean =>
  (preselected?.subject?.kind === UserKind &&
    preselected?.subject?.value !== undefined &&
    !newUsers.includes(preselected.subject.value)) ||
  preselected?.subject?.kind !== UserKind

/**
 * True when subject.group has changed and is different to preselected.subject.value,
 * or when preselected subject kind is not Group.
 */
export const getIsChangingSubjectForGroupChange = (
  preselected: RoleAssignmentPreselected | undefined,
  newGroups: string[]
): boolean =>
  (preselected?.subject?.kind === GroupKind &&
    preselected?.subject?.value !== undefined &&
    !newGroups.includes(preselected.subject.value)) ||
  preselected?.subject?.kind !== GroupKind
