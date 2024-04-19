/* Copyright Contributors to the Open Cluster Management project */
import { Routes, Route, Navigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../NavigationPath'
import { CreateCredentialsPage } from './CreateCredentials'
import { CreateCredentialsAWS } from './CreateCredentialsType/CreateCredentialsAWS'
import { ViewEditCredentialsFormPage } from './CredentialsForm'
import CredentialsPage from './CredentialsPage'

export default function Credentials() {
  return (
    <Routes>
      <Route path={NavigationPath.addAWSType} element={<CreateCredentialsAWS />} />
      <Route path="/create" element={<CreateCredentialsPage />} />
      <Route path="/edit/:namespace/:name" element={<ViewEditCredentialsFormPage />} />
      <Route path="/details/:namespace/:name" element={<ViewEditCredentialsFormPage />} />
      <Route path="/" element={<CredentialsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
