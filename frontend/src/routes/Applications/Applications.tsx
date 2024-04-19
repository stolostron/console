/* Copyright Contributors to the Open Cluster Management project */
import { Route, Routes } from 'react-router-dom-v5-compat'
import ApplicationsDetailsPage from './ApplicationDetails/ApplicationDetails'
import ApplicationsPage from './ApplicationsPage'
import { CreateApplicationArgo } from './CreateApplication/CreateApplicationArgo'
import { EditArgoApplicationSet } from './CreateApplication/EditArgoApplicationSet'
import { CreateApplicationArgoPullModel } from './CreateApplication/CreateApplicationArgoPullModel'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'

export default function Applications() {
  return (
    <Routes>
      <Route path="/create/argo" element={<CreateApplicationArgo />} />
      <Route path="/edit/argo/:namespace/:name" element={<EditArgoApplicationSet />} />
      <Route path="/create/argopullmodel" element={<CreateApplicationArgoPullModel />} />
      <Route path="/create/subscription" element={<CreateSubscriptionApplicationPage />} />
      <Route path="/edit/subscription/:namespace/:name" element={<CreateSubscriptionApplicationPage />} />
      <Route path="/details/:namespace/:name" element={<ApplicationsDetailsPage />} />
      <Route path="/*" element={<ApplicationsPage />} />
    </Routes>
  )
}
