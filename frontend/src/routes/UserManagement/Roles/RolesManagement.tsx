/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../../NavigationPath'
import { Roles } from './Roles'
import { RoleDetail } from './RoleDetail'
import { RoleYaml } from './RoleYaml'
import { RolePermissions } from './RolePermissions'
import { RoleRoleAssignments } from './RoleRoleAssignments'

const rolesChildPath = createRoutePathFunction(NavigationPath.roles)

export default function RolesManagement() {
  return (
    <Routes>
      {/* Role detail routes */}
      <Route path={rolesChildPath(NavigationPath.rolesYaml)} element={<RoleYaml />} />
      <Route path={rolesChildPath(NavigationPath.rolesPermissions)} element={<RolePermissions />} />
      <Route path={rolesChildPath(NavigationPath.rolesRoleAssignments)} element={<RoleRoleAssignments />} />
      <Route path={rolesChildPath(NavigationPath.rolesDetails)} element={<RoleDetail />} />

      {/* Main roles page */}
      <Route path={rolesChildPath(NavigationPath.roles)} element={<Roles />} />

      <Route path="*" element={<Navigate to={NavigationPath.roles} replace />} />
    </Routes>
  )
}
