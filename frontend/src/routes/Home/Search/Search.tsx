/* Copyright Contributors to the Open Cluster Management project */
import { Route, Routes } from 'react-router-dom-v5-compat'
import { SearchAlertGroupProvider } from './components/SearchAlertGroup'
import DetailsPage from './Details/DetailsPage'
import SearchPage from './SearchPage'

export default function Search() {
  return (
    <SearchAlertGroupProvider>
      <Routes>
        <Route path="/resources/*" element={<DetailsPage />} />
        <Route path="/" element={<SearchPage />} />
      </Routes>
    </SearchAlertGroupProvider>
  )
}
