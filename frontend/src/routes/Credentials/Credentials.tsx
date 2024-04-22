/* Copyright Contributors to the Open Cluster Management project */
import { Routes, Route } from 'react-router-dom-v5-compat'
import { CreateCredentialsPage } from './CreateCredentials'
import { CreateCredentialsAWS } from './CreateCredentialsType/CreateCredentialsAWS'
import { ViewEditCredentialsFormPage } from './CredentialsForm'
import CredentialsPage from './CredentialsPage'

export default function Credentials() {
  return (
    <Routes>
      <Route path="/create/aws/type" element={<CreateCredentialsAWS />} />
      <Route path="/create" element={<CreateCredentialsPage />} />
      <Route path="/edit/:namespace/:name" element={<ViewEditCredentialsFormPage />} />
      <Route path="/details/:namespace/:name" element={<ViewEditCredentialsFormPage />} />
      <Route path="/" element={<CredentialsPage />} />
    </Routes>
  )
}
