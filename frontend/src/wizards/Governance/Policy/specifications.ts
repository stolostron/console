/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import policylimitclusteradmin from './stable/AC-Access-Control/policy-limitclusteradmin.yaml'
import policyrole from './stable/AC-Access-Control/policy-role.yaml'
import policyrolebinding from './stable/AC-Access-Control/policy-rolebinding.yaml'
import policycomplianceoperatorinstall from './stable/CA-Security-Assessment-and-Authorization/policy-compliance-operator-install.yaml'
import policycomplianceoperatorcisscan from './stable/CM-Configuration-Management/policy-compliance-operator-cis-scan.yaml'
import policycomplianceoperatore8scan from './stable/CM-Configuration-Management/policy-compliance-operator-e8-scan.yaml'
import policygatekeeperoperatordownstream from './stable/CM-Configuration-Management/policy-gatekeeper-operator-downstream.yaml'
import policynamespace from './stable/CM-Configuration-Management/policy-namespace.yaml'
import policypod from './stable/CM-Configuration-Management/policy-pod.yaml'
import policycertificate from './stable/SC-System-and-Communications-Protection/policy-certificate.yaml'
import policyetcdencryption from './stable/SC-System-and-Communications-Protection/policy-etcdencryption.yaml'
import policylimitmemory from './stable/SC-System-and-Communications-Protection/policy-limitmemory.yaml'
import policypsp from './stable/SC-System-and-Communications-Protection/policy-psp.yaml'
import policyscc from './stable/SC-System-and-Communications-Protection/policy-scc.yaml'
import policyimagemanifestvuln from './stable/SI-System-and-Information-Integrity/policy-imagemanifestvuln.yaml'

function getExamplePolicy(yaml: string) {
  const resources = YAML.parseAllDocuments(yaml).map((doc) => doc.toJSON())
  const policy = resources.find((resource) => resource.kind === 'Policy')
  return policy
}

function getPolicySpecification(description: string, yaml: string) {
  yaml = yaml.replace('sample-rolebinding', '')
  yaml = yaml.replace('sample-role', '')
  yaml = yaml.replace('-example', '')
  yaml = yaml.replace('name: prod', 'name: ""')
  yaml = yaml.replace('sample-nginx-pod', '')
  const policy = getExamplePolicy(yaml)
  return {
    name: description,
    description,
    standards: policy.metadata?.annotations?.['policy.open-cluster-management.io/standards'] ?? '',
    categories: policy.metadata?.annotations?.['policy.open-cluster-management.io/categories'] ?? '',
    controls: policy.metadata?.annotations?.['policy.open-cluster-management.io/controls'] ?? '',
    policyTemplates: (policy.spec?.['policy-templates'] ?? []) as object[],
  }
}

export const Specifications: {
  name: string
  description: string
  standards: string
  categories: string
  controls: string
  policyTemplates: object[]
}[] = [
  getPolicySpecification('Limit cluster admin roles', policylimitclusteradmin),
  getPolicySpecification('Role must follow defined permissions', policyrole),
  getPolicySpecification('Role binding must exist', policyrolebinding),
  getPolicySpecification('Install the Compliance operator', policycomplianceoperatorinstall),
  getPolicySpecification('Scan your cluster with the OpenShift CIS security profile', policycomplianceoperatorcisscan),
  getPolicySpecification(
    'Scan your cluster with the E8 (Essential 8) security profile',
    policycomplianceoperatore8scan
  ),
  getPolicySpecification('Install Red Hat Gatekeeper Operator policy', policygatekeeperoperatordownstream),
  getPolicySpecification('Namespace must exist', policynamespace),
  getPolicySpecification('Pod must exist', policypod),
  getPolicySpecification('Certificate management expiration', policycertificate),
  getPolicySpecification('Enable etcd encryption', policyetcdencryption),
  getPolicySpecification('Limit container memory usage', policylimitmemory),
  getPolicySpecification('No privileged pods', policypsp),
  getPolicySpecification('Restricted Security Context Constraints', policyscc),
  getPolicySpecification('Detect image vulnerabilities', policyimagemanifestvuln),
].sort((a, b) => {
  if (a.name < b.name) {
    return -1
  }
  return a.name > b.name ? 1 : 0
})
