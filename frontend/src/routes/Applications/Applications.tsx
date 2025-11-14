/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import ApplicationsDetailsPage from './ApplicationDetails/ApplicationDetails'
import ApplicationsPage from './ApplicationsPage'
import Overview from './Overview'
import AdvancedConfiguration from './AdvancedConfiguration'
import { CreateApplicationArgo } from './CreateArgoApplication/CreateApplicationArgo'
import { EditArgoApplicationSet } from './CreateArgoApplication/EditArgoApplicationSet'
import { CreateApplicationArgoPullModel } from './CreateArgoApplication/CreateApplicationArgoPullModel'
import CreateSubscriptionApplicationPage from './CreateSubscriptionApplication/SubscriptionApplication'
import { MatchType, NavigationPath, SubRoutesRedirect, createRoutePathFunction } from '../../NavigationPath'
import { ApplicationDetailsPageContent } from './ApplicationDetails/ApplicationDetails/ApplicationDetails'
import { ApplicationTopologyPageContent } from './ApplicationDetails/ApplicationTopology/ApplicationTopology'

const applicationsChildPath = createRoutePathFunction(NavigationPath.applications)

export default function Applications() {
  return (
    <Routes>
      <Route path={applicationsChildPath(NavigationPath.createApplicationArgo)} element={<CreateApplicationArgo />} />
      <Route path={applicationsChildPath(NavigationPath.editApplicationArgo)} element={<EditArgoApplicationSet />} />
      <Route
        path={applicationsChildPath(NavigationPath.createApplicationArgoPullModel)}
        element={<CreateApplicationArgoPullModel />}
      />
      <Route
        path={applicationsChildPath(NavigationPath.createApplicationSubscription)}
        element={<CreateSubscriptionApplicationPage />}
      />
      <Route
        path={applicationsChildPath(NavigationPath.editApplicationSubscription)}
        element={<CreateSubscriptionApplicationPage />}
      />
      <Route element={<ApplicationsDetailsPage />}>
        <Route
          path={applicationsChildPath(NavigationPath.applicationTopology)}
          element={<ApplicationTopologyPageContent />}
        />
        <Route
          path={applicationsChildPath(NavigationPath.applicationOverview)}
          element={<ApplicationDetailsPageContent />}
        />
      </Route>
      <Route
        path={applicationsChildPath(NavigationPath.applicationDetails, MatchType.SubRoutes)}
        element={
          <SubRoutesRedirect
            matchPath={NavigationPath.applicationDetails}
            targetPath={NavigationPath.applicationTopology}
          />
        }
      />
      <Route
        path={applicationsChildPath(NavigationPath.applicationOverview, MatchType.SubRoutes)}
        element={
          <SubRoutesRedirect
            matchPath={NavigationPath.applicationOverview}
            targetPath={NavigationPath.applicationOverview}
          />
        }
      />
      <Route element={<ApplicationsPage />}>
        <Route path={applicationsChildPath(NavigationPath.advancedConfiguration)} element={<AdvancedConfiguration />} />
        <Route path={applicationsChildPath(NavigationPath.applications)} element={<Overview />} />
      </Route>
      <Route path="*" element={<Navigate to={NavigationPath.applications} replace />} />
    </Routes>
  )
}
