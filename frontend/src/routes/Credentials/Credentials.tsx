/* Copyright Contributors to the Open Cluster Management project */
import { Routes, Route, Navigate } from 'react-router-dom-v5-compat'
import { CreateCredentialsPage } from './CreateCredentials'
import { CreateCredentialsAWS } from './CreateCredentialsType/CreateCredentialsAWS'
import { ViewEditCredentialsFormPage } from './CredentialsForm'
import CredentialsPage from './CredentialsPage'
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'

const credentialsChildPath = createRoutePathFunction(NavigationPath.credentials)

export default function Credentials() {
  return (
    <Routes>
      <Route path={credentialsChildPath(NavigationPath.addAWSType)} element={<CreateCredentialsAWS />} />
      <Route path={credentialsChildPath(NavigationPath.addCredentials)} element={<CreateCredentialsPage />} />
      <Route path={credentialsChildPath(NavigationPath.editCredentials)} element={<ViewEditCredentialsFormPage />} />
      <Route path={credentialsChildPath(NavigationPath.viewCredentials)} element={<ViewEditCredentialsFormPage />} />
      <Route path={credentialsChildPath(NavigationPath.credentials)} element={<CredentialsPage />} />
      <Route path="*" element={<Navigate to={NavigationPath.credentials} replace />} />
    </Routes>
  )
}
