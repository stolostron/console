/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { SearchAlertGroupProvider } from './components/SearchAlertGroup'
import DetailsPage from './Details/DetailsPage'
import SearchPage from './SearchPage'
import { NavigationPath, createRoutePathFunction } from '../../../NavigationPath'
import YAMLPage from './Details/YAMLPage'
import RelatedResourceDetailsTab from './Details/RelatedResourceDetailsTab'
import LogsPage from './Details/LogsPage'
import DetailsOverviewPage from './Details/DetailsOverviewPage'

const searchChildPath = createRoutePathFunction(NavigationPath.search)

export default function Search() {
  return (
    <SearchAlertGroupProvider>
      <Routes>
        <Route element={<DetailsPage />}>
          <Route path={searchChildPath(NavigationPath.resourceYAML)} element={<YAMLPage />} />
          <Route path={searchChildPath(NavigationPath.resourceRelated)} element={<RelatedResourceDetailsTab />} />
          <Route path={searchChildPath(NavigationPath.resourceLogs)} element={<LogsPage />} />
          <Route path={searchChildPath(NavigationPath.resources)} element={<DetailsOverviewPage />} />
        </Route>
        <Route path={searchChildPath(NavigationPath.search)} element={<SearchPage />} />
        <Route path="*" element={<Navigate to={NavigationPath.search} replace />} />
      </Routes>
    </SearchAlertGroupProvider>
  )
}
