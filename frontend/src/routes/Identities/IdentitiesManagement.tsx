/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import IdentitiesPage from './IdentitiesPage'
import { Users } from './Users/Users'
import { Groups } from './Groups/Groups'
import { ServiceAccounts } from './ServiceAccounts/ServiceAccounts'
import { UserDetail } from './Users/UserDetail'
import { UserDetails } from './Users/UserDetails'
import { UserYaml } from './Users/UserYaml'
import { UserRoleAssignments } from './Users/UserRoleAssignments'
import { UserGroups } from './Users/UserGroups'
import { GroupDetail } from './Groups/GroupDetail'
import { GroupYaml } from './Groups/GroupYaml'
import { GroupRoleAssignments } from './Groups/GroupRoleAssignments'
import { GroupUsers } from './Groups/GroupUsers'
import { ServiceAccountDetail } from './ServiceAccounts/ServiceAccountDetail'
import { ServiceAccountYaml } from './ServiceAccounts/ServiceAccountYaml'
import { ServiceAccountRoleAssignments } from './ServiceAccounts/ServiceAccountRoleAssignments'
import { ServiceAccountGroups } from './ServiceAccounts/ServiceAccountGroups'

const identitiesChildPath = createRoutePathFunction(NavigationPath.identities)

export default function IdentitiesManagement() {
  return (
    <Routes>
      {/* User detail routes with nested tabs */}
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersDetails)} element={<UserDetail />}>
        <Route index element={<UserDetails />} />
      </Route>
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersYaml)} element={<UserDetail />}>
        <Route index element={<UserYaml />} />
      </Route>
      <Route
        path={identitiesChildPath(NavigationPath.identitiesUsersRoleAssignments)}
        element={<UserDetail />}
      >
        <Route index element={<UserRoleAssignments />} />
      </Route>
      <Route
        path={identitiesChildPath(NavigationPath.identitiesUsersRoleAssignmentsCreate)}
        element={<UserDetail />}
      >
        <Route index element={<UserRoleAssignments />} />
      </Route>
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersGroups)} element={<UserDetail />}>
        <Route index element={<UserGroups />} />
      </Route>

      {/* Group detail routes */}
      <Route path={identitiesChildPath(NavigationPath.identitiesGroupsYaml)} element={<GroupYaml />} />
      <Route
        path={identitiesChildPath(NavigationPath.identitiesGroupsRoleAssignments)}
        element={<GroupRoleAssignments />}
      />
      <Route path={identitiesChildPath(NavigationPath.identitiesGroupsUsers)} element={<GroupUsers />} />
      <Route path={identitiesChildPath(NavigationPath.identitiesGroupsDetails)} element={<GroupDetail />} />

      {/* Service Account detail routes */}
      <Route
        path={identitiesChildPath(NavigationPath.identitiesServiceAccountsYaml)}
        element={<ServiceAccountYaml />}
      />
      <Route
        path={identitiesChildPath(NavigationPath.identitiesServiceAccountsRoleAssignments)}
        element={<ServiceAccountRoleAssignments />}
      />
      <Route path={identitiesChildPath(NavigationPath.identitiesServiceAccountsGroups)} element={<ServiceAccountGroups />} />
      <Route path={identitiesChildPath(NavigationPath.identitiesServiceAccountsDetails)} element={<ServiceAccountDetail />} />

      {/* Main page with tabs with Users, Groups, and Service Accounts */}
      <Route element={<IdentitiesPage />}>
        <Route path={identitiesChildPath(NavigationPath.identitiesUsers)} element={<Users />} />
        <Route path={identitiesChildPath(NavigationPath.identitiesGroups)} element={<Groups />} />
        <Route path={identitiesChildPath(NavigationPath.identitiesServiceAccounts)} element={<ServiceAccounts />} />
      </Route>

      {/* Default redirect to users */}
      <Route path="*" element={<Navigate to={NavigationPath.identitiesUsers} replace />} />
    </Routes>
  )
}
