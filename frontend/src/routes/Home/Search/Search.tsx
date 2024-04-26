/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import DetailsPage from './Details/DetailsPage'
import SearchPage from './SearchPage'

export default function Search() {
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)

  if (isGlobalHub && settings.globalSearchFeatureFlag === 'enabled') {
    // Details page is not supported in Global search in 2.9
    return (
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/resources/*" element={<DetailsPage />} />
      <Route path="/" element={<SearchPage />} />
    </Routes>
  )
}
