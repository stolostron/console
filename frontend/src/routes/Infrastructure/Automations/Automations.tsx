/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import AnsibleAutomationsPage from './AnsibleAutomations'
import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'
import { NavigationPath, createRoutePathFunction } from '../../../NavigationPath'

const automationsChildPath = createRoutePathFunction(NavigationPath.ansibleAutomations)

export default function Automations() {
  return (
    <Routes>
      <Route
        path={automationsChildPath(NavigationPath.addAnsibleAutomation)}
        element={<AnsibleAutomationsFormPage />}
      />
      <Route
        path={automationsChildPath(NavigationPath.editAnsibleAutomation)}
        element={<AnsibleAutomationsFormPage />}
      />
      <Route path={automationsChildPath(NavigationPath.ansibleAutomations)} element={<AnsibleAutomationsPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.ansibleAutomations} replace />} />
    </Routes>
  )
}
