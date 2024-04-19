/* Copyright Contributors to the Open Cluster Management project */
import { Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../NavigationPath'
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
      <Route path={NavigationPath.createPolicyAutomation} element={<CreatePolicyAutomation />} />
      <Route path={NavigationPath.editPolicyAutomation} element={<EditPolicyAutomation />} />
      <Route path={NavigationPath.policyTemplateDetails} element={<PolicyTemplateDetailsPage />} />
      <Route path={NavigationPath.policyDetailsHistory} element={<PolicyDetailsHistoryPage />} />
      <Route path="/policies/details/:namespace/:name" element={<PolicyDetailsPage />} />
      <Route path="/policy-sets/create" element={<CreatePolicySet />} />
      <Route path={NavigationPath.editPolicySet} element={<EditPolicySet />} />
      <Route path="/*" element={<GovernancePage />} />
    </Routes>
  )
}
