/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import CreateInfraEnv from './CreateInfraEnv'
import InfraEnvironmentDetailsPage from './Details/InfraEnvironmentDetailsPage'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export default function InfraEnvironments() {
  return (
    <Routes>
      <Route path="/details/:namespace/:name/*" element={<InfraEnvironmentDetailsPage />} />
      <Route path="/create" element={<CreateInfraEnv />} />
      <Route path="/" element={<InfraEnvironmentsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
