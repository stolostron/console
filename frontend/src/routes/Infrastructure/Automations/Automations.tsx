/* Copyright Contributors to the Open Cluster Management project */
import { Route, Routes } from 'react-router-dom-v5-compat'
import AnsibleAutomationsPage from './AnsibleAutomations'
import AnsibleAutomationsFormPage from './AnsibleAutomationsForm'

export default function Automations() {
  return (
    <Routes>
      <Route path="/add" element={<AnsibleAutomationsFormPage />} />
      <Route path="/edit/:namespace/:name" element={<AnsibleAutomationsFormPage />} />
      <Route path="/" element={<AnsibleAutomationsPage />} />
    </Routes>
  )
}
