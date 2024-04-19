/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import AnsibleAutomationsPage from './AnsibleAutomations'
// import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'

export default function Automations() {
  return (
    <Routes>
      {/* <Route path={NavigationPath.addAnsibleAutomation} element={<AnsibleAutomationsFormPage />} />
      <Route path={NavigationPath.editAnsibleAutomation} element={<AnsibleAutomationsFormPage />} /> */}
      <Route path="/" element={<AnsibleAutomationsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
