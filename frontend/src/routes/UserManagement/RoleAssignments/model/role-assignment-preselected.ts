type RoleAssignmentPreselectedEntity = { name: string; id: string }

type RoleAssignmentPreselected = {
  users?: RoleAssignmentPreselectedEntity[]
  groups?: RoleAssignmentPreselectedEntity[]
  roles?: RoleAssignmentPreselectedEntity[]
  cluterSets?: RoleAssignmentPreselectedEntity[]
}

export type { RoleAssignmentPreselected, RoleAssignmentPreselectedEntity }
