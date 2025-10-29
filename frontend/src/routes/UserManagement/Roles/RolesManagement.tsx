/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../../NavigationPath'
import { RolesPage } from './RolesPage'
import { RolePage } from './Role/RolePage'
import { RoleDetail } from './Role/RoleDetail'
import { RoleYaml } from './Role/RoleYaml'
import { RolePermissions } from './Role/RolePermissions'
import { RoleRoleAssignments } from './Role/RoleRoleAssignments'

const rolesChildPath = createRoutePathFunction(NavigationPath.roles)

export default function RolesManagement() {
  return (
    <Routes>
      {/* Role detail pages with navigation */}
      <Route path={rolesChildPath(NavigationPath.roleDetails)} element={<RolePage />}>
        <Route index element={<RoleDetail />} />
      </Route>
      <Route path={rolesChildPath(NavigationPath.rolePermissions)} element={<RolePage />}>
        <Route index element={<RolePermissions />} />
      </Route>
      <Route path={rolesChildPath(NavigationPath.roleRoleAssignments)} element={<RolePage />}>
        <Route index element={<RoleRoleAssignments />} />
      </Route>
      <Route path={rolesChildPath(NavigationPath.roleYaml)} element={<RolePage />}>
        <Route index element={<RoleYaml />} />
      </Route>

      {/* Main roles page with list of roles */}
      <Route path={rolesChildPath(NavigationPath.roles)} element={<RolesPage />} />

      {/* Default redirect to roles */}
      <Route path="*" element={<Navigate to={NavigationPath.roles} replace />} />
    </Routes>
  )
}
