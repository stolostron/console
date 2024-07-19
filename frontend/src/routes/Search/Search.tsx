/* Copyright Contributors to the Open Cluster Management project */
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { createRoutePathFunction, NavigationPath } from '../../NavigationPath'
import { SearchAlertGroupProvider } from './components/SearchAlertGroup'
import DetailsOverviewPage from './Details/DetailsOverviewPage'
import DetailsPage from './Details/DetailsPage'
import LogsPage from './Details/LogsPage'
import RelatedResourceDetailsTab from './Details/RelatedResourceDetailsTab'
import YAMLPage from './Details/YAMLPage'
import SearchPage from './SearchPage'

const searchChildPath = createRoutePathFunction(NavigationPath.search)

export default function Search() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect: 2.12 moves search & details pages from /multicloud/home/search -> /multicloud/search
    if (location.pathname.startsWith('/multicloud/home/search')) {
      navigate({
        pathname: location.pathname.replace('/home', ''),
        search: location.search,
      })
    }
  }, [location.pathname, location.search, navigate])

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
