/* Copyright Contributors to the Open Cluster Management project */
import { RoleAssignmentPreselected } from '../../routes/UserManagement/RoleAssignments/model/role-assignment-preselected'
import { GroupKind, UserKind } from '../../resources'

/** Fixture case for subject kind change: isChangingSubject when subject.kind has changed and is different to preselected */
export interface IsChangingSubjectKindCase {
  description: string
  preselected: RoleAssignmentPreselected | undefined
  newKind: string
  expected: boolean
}

export const isChangingSubjectKindCases: IsChangingSubjectKindCase[] = [
  {
    description: 'preselected User, changing to Group → true',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    newKind: GroupKind,
    expected: true,
  },
  {
    description: 'preselected Group, changing to User → true',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    newKind: UserKind,
    expected: true,
  },
  {
    description: 'preselected User, staying User → false',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    newKind: UserKind,
    expected: false,
  },
  {
    description: 'preselected Group, staying Group → false',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    newKind: GroupKind,
    expected: false,
  },
  {
    description: 'no preselected subject kind → false',
    preselected: {},
    newKind: UserKind,
    expected: false,
  },
  {
    description: 'preselected with kind but no value, changing kind → true',
    preselected: { subject: { kind: UserKind } },
    newKind: GroupKind,
    expected: true,
  },
]

/** Fixture case for user change: isChangingSubject when subject.user changed and different to preselected.subject.value or subject.kind is different to User */
export interface IsChangingSubjectUserCase {
  description: string
  preselected: RoleAssignmentPreselected | undefined
  users: string[]
  expected: boolean
}

export const isChangingSubjectUserCases: IsChangingSubjectUserCase[] = [
  {
    description: 'preselected User with value, users include preselected value → false',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    users: ['alice'],
    expected: false,
  },
  {
    description: 'preselected User with value, users do not include preselected value → true',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    users: ['bob'],
    expected: true,
  },
  {
    description: 'preselected User with value, users empty → true',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    users: [],
    expected: true,
  },
  {
    description: 'preselected User with value, users include multiple with preselected → false',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    users: ['bob', 'alice'],
    expected: false,
  },
  {
    description: 'preselected Group (kind not User) → true',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    users: ['alice'],
    expected: true,
  },
  {
    description: 'preselected has no subject kind → true (preselected?.subject?.kind !== UserKind)',
    preselected: {},
    users: ['alice'],
    expected: true,
  },
  {
    description: 'preselected User but no value, users set → false (value undefined so first part false, kind is User so second part false)',
    preselected: { subject: { kind: UserKind } },
    users: ['alice'],
    expected: false,
  },
]

/** Fixture case for group change: isChangingSubject when subject.group changed and different to preselected.subject.value or subject.kind is different to Group */
export interface IsChangingSubjectGroupCase {
  description: string
  preselected: RoleAssignmentPreselected | undefined
  groups: string[]
  expected: boolean
}

export const isChangingSubjectGroupCases: IsChangingSubjectGroupCase[] = [
  {
    description: 'preselected Group with value, groups include preselected value → false',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    groups: ['admins'],
    expected: false,
  },
  {
    description: 'preselected Group with value, groups do not include preselected value → true',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    groups: ['editors'],
    expected: true,
  },
  {
    description: 'preselected Group with value, groups empty → true',
    preselected: { subject: { kind: GroupKind, value: 'admins' } },
    groups: [],
    expected: true,
  },
  {
    description: 'preselected User (kind not Group) → true',
    preselected: { subject: { kind: UserKind, value: 'alice' } },
    groups: ['admins'],
    expected: true,
  },
  {
    description: 'preselected has no subject kind → true',
    preselected: {},
    groups: ['admins'],
    expected: true,
  },
  {
    description: 'preselected Group but no value, groups set → false',
    preselected: { subject: { kind: GroupKind } },
    groups: ['admins'],
    expected: false,
  },
]
