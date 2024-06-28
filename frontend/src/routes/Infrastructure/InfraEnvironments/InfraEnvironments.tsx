/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import CreateInfraEnv from './CreateInfraEnv'
import InfraEnvironmentDetailsPage from './Details/InfraEnvironmentDetailsPage'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'
import { MatchType, NavigationPath, SubRoutesRedirect, createRoutePathFunction } from '../../../NavigationPath'
import DetailsTab from './Details/DetailsTab'
import HostsTab from './Details/HostsTab'

const infraEnvironmentsChildPath = createRoutePathFunction(NavigationPath.infraEnvironments)

export default function InfraEnvironments() {
  return (
    <Routes>
      <Route element={<InfraEnvironmentDetailsPage />}>
        <Route path={infraEnvironmentsChildPath(NavigationPath.infraEnvironmentOverview)} element={<DetailsTab />} />
        <Route path={infraEnvironmentsChildPath(NavigationPath.infraEnvironmentHosts)} element={<HostsTab />} />
      </Route>
      <Route
        path={infraEnvironmentsChildPath(NavigationPath.infraEnvironmentDetails, MatchType.SubRoutes)}
        element={
          <SubRoutesRedirect
            matchPath={NavigationPath.infraEnvironmentDetails}
            targetPath={NavigationPath.infraEnvironmentOverview}
          />
        }
      />
      <Route path={infraEnvironmentsChildPath(NavigationPath.createInfraEnv)} element={<CreateInfraEnv />} />
      <Route path={infraEnvironmentsChildPath(NavigationPath.infraEnvironments)} element={<InfraEnvironmentsPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.infraEnvironments} replace />} />
    </Routes>
  )
}
