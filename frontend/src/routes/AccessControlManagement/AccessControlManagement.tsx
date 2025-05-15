/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import { AccessControlManagementPage } from './AccessControlManagementPage'
import { CreateAccessControlManagementPage } from './CreateAccessControlManagementPage'
import { EditAcessControlManagementPage } from './EditAcessControlManagementPage'
import { ViewAccessControlManagementPage } from './ViewAccessControlManagementPage'

const accessControlManagementChildPath = createRoutePathFunction(NavigationPath.accessControlManagement)

export default function AccessControlManagement() {
  return (
    <Routes>
      <Route
        path={accessControlManagementChildPath(NavigationPath.addAccessControlManagement)}
        element={<CreateAccessControlManagementPage />}
      />
      <Route
        path={accessControlManagementChildPath(NavigationPath.editAccessControlManagement)}
        element={<EditAcessControlManagementPage />}
      />
      <Route
        path={accessControlManagementChildPath(NavigationPath.viewAccessControlManagement)}
        element={<ViewAccessControlManagementPage />}
      />
      <Route
        path={accessControlManagementChildPath(NavigationPath.accessControlManagement)}
        element={<AccessControlManagementPage />}
      />
      <Route path="*" element={<Navigate to={NavigationPath.accessControlManagement} replace />} />
    </Routes>
  )
}
