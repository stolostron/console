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
import { NavigationPath, createRoutePathFunction } from '../../NavigationPath'
import PolicyDetailsOverview from './policies/policy-details/PolicyDetailsOverview'
import PolicyDetailsResults from './policies/policy-details/PolicyDetailsResults'
import GovernanceOverview from './overview/Overview'
import PolicySetsPage from './policy-sets/PolicySets'
import PoliciesPage from './policies/Policies'
import { PolicyTemplateDetails } from './policies/policy-details/PolicyTemplateDetails'
import PolicyTemplateYaml from './policies/policy-details/PolicyTemplateYaml'

const governanceChildPath = createRoutePathFunction(NavigationPath.governance)

export default function Governance() {
  return (
    <Routes>
      <Route path={governanceChildPath(NavigationPath.createPolicy)} element={<CreatePolicy />} />
      <Route path={governanceChildPath(NavigationPath.editPolicy)} element={<EditPolicy />} />
      <Route path={governanceChildPath(NavigationPath.createPolicyAutomation)} element={<CreatePolicyAutomation />} />
      <Route path={governanceChildPath(NavigationPath.editPolicyAutomation)} element={<EditPolicyAutomation />} />
      <Route path={governanceChildPath(NavigationPath.policyDetailsHistory)} element={<PolicyDetailsHistoryPage />} />
      <Route element={<PolicyTemplateDetailsPage />}>
        <Route path={governanceChildPath(NavigationPath.policyTemplateDetails)} element={<PolicyTemplateDetails />} />
        <Route path={governanceChildPath(NavigationPath.policyTemplateYaml)} element={<PolicyTemplateYaml />} />
      </Route>
      <Route element={<PolicyDetailsPage />}>
        <Route path={governanceChildPath(NavigationPath.policyDetails)} element={<PolicyDetailsOverview />} />
        <Route path={governanceChildPath(NavigationPath.policyDetailsResults)} element={<PolicyDetailsResults />} />
      </Route>
      <Route path={governanceChildPath(NavigationPath.createPolicySet)} element={<CreatePolicySet />} />
      <Route path={governanceChildPath(NavigationPath.editPolicySet)} element={<EditPolicySet />} />
      <Route element={<GovernancePage />}>
        <Route path={governanceChildPath(NavigationPath.governance)} element={<GovernanceOverview />} />
        <Route path={governanceChildPath(NavigationPath.policySets)} element={<PolicySetsPage />} />
        <Route path={governanceChildPath(NavigationPath.policies)} element={<PoliciesPage />} />
      </Route>
    </Routes>
  )
}
