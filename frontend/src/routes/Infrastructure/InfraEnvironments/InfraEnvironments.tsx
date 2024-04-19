/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import CreateInfraEnv from './CreateInfraEnv'
// import InfraEnvironmentDetailsPage from './Details/InfraEnvironmentDetailsPage'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export default function InfraEnvironments() {
  return (
    <Routes>
      {/* <Route path={NavigationPath.infraEnvironmentDetails} element={<InfraEnvironmentDetailsPage />} /> */}
      <Route path={NavigationPath.createInfraEnv} element={<CreateInfraEnv />} />
      <Route path="/" element={<InfraEnvironmentsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
