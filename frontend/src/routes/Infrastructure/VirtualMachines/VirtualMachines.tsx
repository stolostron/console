/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { createRoutePathFunction, NavigationPath } from '../../../NavigationPath'
import VirtualMachinesPage from './VirtualMachinesPage'

const virtualMachineChildPath = createRoutePathFunction(NavigationPath.virtualMachines)

export default function VirtualMachines() {
  return (
    <Routes>
      <Route path={virtualMachineChildPath(NavigationPath.virtualMachines)} element={<VirtualMachinesPage />} />
      <Route
        path={virtualMachineChildPath(NavigationPath.virtualMachinesForCluster)}
        element={<VirtualMachinesPage />}
      />
      <Route
        path={virtualMachineChildPath(NavigationPath.virtualMachinesForNamespace)}
        element={<VirtualMachinesPage />}
      />
      <Route path="*" element={<Navigate to={NavigationPath.virtualMachines} replace />} />
    </Routes>
  )
}
