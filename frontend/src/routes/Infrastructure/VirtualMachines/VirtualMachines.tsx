/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { createRoutePathFunction, NavigationPath } from '../../../NavigationPath'
import VirtualMachinesPage from './VirtualMachinesPage'
import MigrateVirtualMachinePage from './MigrateVirtualMachinePage'

const virtualMachineChildPath = createRoutePathFunction(NavigationPath.virtualMachines)

export default function VirtualMachines() {
  return (
    <Routes>
      <Route path={virtualMachineChildPath(NavigationPath.virtualMachines)} element={<VirtualMachinesPage />}>
        <Route
          path={virtualMachineChildPath(NavigationPath.migrateVirtualMachine)}
          element={<MigrateVirtualMachinePage />}
        />
      </Route>
      <Route path="*" element={<Navigate to={NavigationPath.virtualMachines} replace />} />
    </Routes>
  )
}
