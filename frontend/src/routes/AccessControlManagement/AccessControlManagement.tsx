/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import { AccessControlManagementPage } from './AccessControlManagementPage'

const accessControlManagementChildPath = createRoutePathFunction(NavigationPath.accessControlManagement)

export default function AccessControlManagement() {
  return (
    <Routes>
      <Route path={accessControlManagementChildPath(NavigationPath.addAccessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path={accessControlManagementChildPath(NavigationPath.editAccessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path={accessControlManagementChildPath(NavigationPath.viewAccessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path={accessControlManagementChildPath(NavigationPath.accessControlManagement)} element={<AccessControlManagementPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.accessControlManagement} replace />} />
    </Routes>
  )
}
