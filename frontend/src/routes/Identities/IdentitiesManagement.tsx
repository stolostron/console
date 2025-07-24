/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import IdentitiesPage from './IdentitiesPage'
import { Users } from './Users'
import { Groups } from './Groups'
import { ServiceAccounts } from './ServiceAccounts'
import { UserDetail } from './UserDetail'
import { UserYaml } from './UserYaml'
import { UserRoleAssignments } from './UserRoleAssignments'
import { UserGroups } from './UserGroups'
import { GroupDetail } from './GroupDetail'
import { GroupYaml } from './GroupYaml'
import { GroupUsers } from './GroupUsers'
import { ServiceAccountYaml } from './ServiceAccountYaml'
import { ServiceAccountRoleAssignments } from './ServiceAccountRoleAssignments'
import { ServiceAccountGroups } from './ServiceAccountGroups'
import { ServiceAccountDetail } from './ServiceAccountDetail'
import { GroupRoleAssignments } from './GroupRoleAssignments'

const identitiesChildPath = createRoutePathFunction(NavigationPath.identities)

export default function IdentitiesManagement() {
  return (
    <Routes>
      {/* User detail routes */}
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersYaml)} element={<UserYaml />} />
      <Route
        path={identitiesChildPath(NavigationPath.identitiesUsersRoleAssignments)}
        element={<UserRoleAssignments />}
      />
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersGroups)} element={<UserGroups />} />
      <Route path={identitiesChildPath(NavigationPath.identitiesUsersDetails)} element={<UserDetail />} />

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
      <Route
        path={identitiesChildPath(NavigationPath.identitiesServiceAccountsGroups)}
        element={<ServiceAccountGroups />}
      />
      <Route
        path={identitiesChildPath(NavigationPath.identitiesServiceAccountsDetails)}
        element={<ServiceAccountDetail />}
      />

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
