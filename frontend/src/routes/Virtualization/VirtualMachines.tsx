/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { createRoutePathFunction, NavigationPath } from '../../NavigationPath'
import VirtualMachinesPage from './VirtualMachinesPage'
import { MigrationDetailedPage } from './MigrationDetailedPage'

const virtualMachineChildPath = createRoutePathFunction(NavigationPath.virtualizationManagement)

export default function VirtualMachines() {
  return (
    <Routes>
      <Route
        path={virtualMachineChildPath(NavigationPath.virtualizationManagement)}
        element={<VirtualMachinesPage />}
      />
      <Route path={virtualMachineChildPath(NavigationPath.migration)} element={<MigrationDetailedPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.virtualMachines} replace />} />
    </Routes>
  )
}
