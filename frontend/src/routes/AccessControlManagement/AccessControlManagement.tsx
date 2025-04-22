/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import { AccessControlManagementPage } from './AccessControlManagementPage'
import { CreateAccessControlManagement } from './CreateAccessControlManagement'

const accessControlManagementChildPath = createRoutePathFunction(NavigationPath.accessControlManagement)

export default function AccessControlManagement() {
  return (
    <Routes>
      <Route path={accessControlManagementChildPath(NavigationPath.addAccessControlManagement)} element={<CreateAccessControlManagement />} />
      <Route path={accessControlManagementChildPath(NavigationPath.editAccessControlManagement)} element={<CreateAccessControlManagement />} />
      <Route path={accessControlManagementChildPath(NavigationPath.viewAccessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path={accessControlManagementChildPath(NavigationPath.accessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.accessControlManagement} replace />} />
    </Routes>
  )
}
