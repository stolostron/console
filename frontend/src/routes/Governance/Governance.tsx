/* Copyright Contributors to the Open Cluster Management project */
import { Route, Routes } from 'react-router-dom-v5-compat'
import GovernancePage from './GovernancePage'
import { CreatePolicy } from './policies/CreatePolicy'
import { CreatePolicyAutomation } from './policies/CreatePolicyAutomation'
import { EditPolicy } from './policies/EditPolicy'
import { EditPolicyAutomation } from './policies/EditPolicyAutomation'
import { PolicyDetailsHistoryPage } from './policies/policy-details/PolicyDetailsHistoryPage'
import { PolicyDetailsPage } from './policies/policy-details/PolicyDetailsPage'
import { PolicyTemplateDetailsPage } from './policies/policy-details/PolicyTemplateDetailsPage'
import { CreatePolicySet } from './policy-sets/CreatePolicySet'
import { EditPolicySet } from './policy-sets/EditPolicySet'

export default function Governance() {
  return (
    <Routes>
      <Route path="/policies/create" element={<CreatePolicy />} />
      <Route path="/policies/edit/:namespace/:name" element={<EditPolicy />} />
      <Route path="/policyautomation/create/:namespace/:name" element={<CreatePolicyAutomation />} />
      <Route path="/policyautomation/edit/:namespace/:name" element={<EditPolicyAutomation />} />
      <Route
        path="/policies/details/:namespace/:name/template/:clusterName/:apiGroup/:apiVersion/:kind/:templateName"
        element={<PolicyTemplateDetailsPage />}
      />
      <Route
        path="/policies/details/:namespace/:name/status/:clusterName/templates/:templateName/history"
        element={<PolicyDetailsHistoryPage />}
      />
      <Route path="/policies/details/:namespace/:name/*" element={<PolicyDetailsPage />} />
      <Route path="/policy-sets/create" element={<CreatePolicySet />} />
      <Route path="/policy-sets/edit/:namespace/:name" element={<EditPolicySet />} />
      <Route path="/*" element={<GovernancePage />} />
    </Routes>
  )
}
