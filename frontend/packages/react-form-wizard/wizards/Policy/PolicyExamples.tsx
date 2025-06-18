import { useHistory } from 'react-router-dom'
import { EditMode } from '../../src'
import { YamlToObject } from '../../src/components/YamlEditor'
import { Catalog } from '../Catalog'
import { clusters, clusterSetBindings, clusterSets, namespaces, placementRules, placements, policies } from '../common/test-data'
import { onSubmit } from '../common/utils'
import { RouteE } from '../Routes'
import { PolicyWizard } from './PolicyWizard'
import editPolicyLimitClusterAdmin from './stable/AC-Access-Control/policy-limitclusteradmin.yaml'
import editPolicyRole from './stable/AC-Access-Control/policy-role.yaml'
import editPolicyRoleBinding from './stable/AC-Access-Control/policy-rolebinding.yaml'
import editPolicyComplianceOperatorInstall from './stable/CA-Security-Assessment-and-Authorization/policy-compliance-operator-install.yaml'
import editPolicyComplianceOperatorCisScan from './stable/CM-Configuration-Management/policy-compliance-operator-cis-scan.yaml'
import editPolicyComplianceOperatorE8Scan from './stable/CM-Configuration-Management/policy-compliance-operator-e8-scan.yaml'
import editPolicyGatekeeperOperatorDownstream from './stable/CM-Configuration-Management/policy-gatekeeper-operator-downstream.yaml'
import editPolicyNamespace from './stable/CM-Configuration-Management/policy-namespace.yaml'
import editPolicyPod from './stable/CM-Configuration-Management/policy-pod.yaml'
import editPolicyCertificate from './stable/SC-System-and-Communications-Protection/policy-certificate.yaml'
import editPolicyEtcdEncryption from './stable/SC-System-and-Communications-Protection/policy-etcdencryption.yaml'
import editPolicyLimitMemory from './stable/SC-System-and-Communications-Protection/policy-limitmemory.yaml'
import editPolicyPsp from './stable/SC-System-and-Communications-Protection/policy-psp.yaml'
import editPolicyScc from './stable/SC-System-and-Communications-Protection/policy-scc.yaml'
import editPolicyImageManifestVuln from './stable/SI-System-and-Information-Integrity/policy-imagemanifestvuln.yaml'

export function onCancel(history: { push: (location: string) => void }) {
    history.push(`./${RouteE.Policy}`)
}

export function PolicyExamples() {
    const history = useHistory()
    return (
        <Catalog
            title="Policy Wizard Examples"
            breadcrumbs={[{ label: 'Example Wizards', to: RouteE.Wizards }, { label: 'Policy Wizard Examples' }]}
            filterGroups={[
                {
                    id: 'security-groups',
                    label: 'Policy annotations',
                    filters: [
                        { value: 'Access Control' },
                        { value: 'Security Assessment and Authorization' },
                        { value: 'Configuration Management' },
                        { value: 'System and Communications Protection' },
                        { value: 'System and Information Integrity' },
                    ],
                },
            ]}
            cards={[
                {
                    title: 'Create Policy',
                    descriptions: [
                        'A policy generates reports and validates cluster compliance based on specified security standards, categories, and controls',
                    ],
                    onClick: () => history.push(RouteE.CreatePolicy),
                },
                {
                    title: 'Limit Cluster Admin Policy',
                    featureGroups: [{ title: 'Policies', features: ['Limit Cluster Admin'] }],
                    labels: ['Access Control'],
                    onClick: () => history.push(RouteE.EditPolicyLimitClusterAdmin),
                },
                {
                    title: 'Role Policy',
                    featureGroups: [{ title: 'Policies', features: ['Role'] }],
                    labels: ['Access Control'],
                    onClick: () => history.push(RouteE.EditPolicyRole),
                },
                {
                    title: 'Role Binding Policy',
                    featureGroups: [{ title: 'Policies', features: ['Role Binding'] }],
                    labels: ['Access Control'],
                    onClick: () => history.push(RouteE.EditPolicyRoleBinding),
                },
                {
                    title: 'Compliance Operator Install Policy',
                    featureGroups: [{ title: 'Policies', features: ['Compliance Operator Install'] }],
                    labels: ['Security Assessment and Authorization'],
                    onClick: () => history.push(RouteE.EditPolicyComplianceOperatorInstall),
                },
                {
                    title: 'Compliance Operator Cis Scan Policy',
                    featureGroups: [{ title: 'Policies', features: ['Compliance Operator Cis Scan'] }],
                    labels: ['Configuration Management'],
                    onClick: () => history.push(RouteE.EditPolicyComplianceOperatorCisScan),
                },
                {
                    title: 'Compliance Operator E8 Scan Policy',
                    featureGroups: [{ title: 'Policies', features: ['Compliance Operator E8 Scan'] }],
                    labels: ['Configuration Management'],
                    onClick: () => history.push(RouteE.EditPolicyComplianceOperatorE8Scan),
                },
                {
                    title: 'Gatekeeper Operator Downstream Policy',
                    featureGroups: [{ title: 'Policies', features: ['Gatekeeper Operator Downstream'] }],
                    labels: ['Configuration Management'],
                    onClick: () => history.push(RouteE.EditPolicyGatekeeperOperatorDownstream),
                },
                {
                    title: 'Namespace Policy',
                    featureGroups: [{ title: 'Policies', features: ['Namespace'] }],
                    labels: ['Configuration Management'],
                    onClick: () => history.push(RouteE.EditPolicyNamespace),
                },
                {
                    title: 'Pod Policy',
                    featureGroups: [{ title: 'Policies', features: ['Pod'] }],
                    labels: ['Configuration Management'],
                    onClick: () => history.push(RouteE.EditPolicyPod),
                },
                {
                    title: 'Certificate Policy',
                    featureGroups: [{ title: 'Policies', features: ['Certificate'] }],
                    labels: ['System and Communications Protection'],
                    onClick: () => history.push(RouteE.EditPolicyCertificate),
                },
                {
                    title: 'Etcd Encryption Policy',
                    featureGroups: [{ title: 'Policies', features: ['Etcd Encryption'] }],
                    labels: ['System and Communications Protection'],
                    onClick: () => history.push(RouteE.EditPolicyEtcdEncryption),
                },
                {
                    title: 'Limit Memory Policy',
                    featureGroups: [{ title: 'Policies', features: ['Limit Memory'] }],
                    labels: ['System and Communications Protection'],
                    onClick: () => history.push(RouteE.EditPolicyLimitMemory),
                },
                {
                    title: 'Psp Policy',
                    featureGroups: [{ title: 'Policies', features: ['Psp'] }],
                    labels: ['System and Communications Protection'],
                    onClick: () => history.push(RouteE.EditPolicyPsp),
                },
                {
                    title: 'Security Context Constraints Policy',
                    featureGroups: [{ title: 'Policies', features: ['Security Context Constraints'] }],
                    labels: ['System and Communications Protection'],
                    onClick: () => history.push(RouteE.EditPolicyScc),
                },
                {
                    title: 'Image Manifest Vuln Policy',
                    featureGroups: [{ title: 'Policies', features: ['Image Manifest Vuln'] }],
                    labels: ['System and Information Integrity'],
                    onClick: () => history.push(RouteE.EditPolicyImageManifestVuln),
                },
            ]}
            onBack={() => history.push(RouteE.Wizards)}
        />
    )
}

export function CreatePolicy() {
    const history = useHistory()
    return (
        <PolicyWizard
            title="Create policy"
            namespaces={namespaces}
            policies={policies}
            placements={placements}
            placementRules={placementRules}
            clusters={clusters}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
        />
    )
}

export function EditPolicy(props: { yaml: string }) {
    const history = useHistory()
    return (
        <PolicyWizard
            namespaces={namespaces}
            policies={policies}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            placements={placements}
            placementRules={placementRules}
            title="Edit policy"
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            editMode={EditMode.Edit}
            resources={YamlToObject(props.yaml, true)}
            gitSource="http://example.com"
            clusters={clusters}
        />
    )
}

export function EditPolicyLimitClusterAdmin() {
    return <EditPolicy yaml={editPolicyLimitClusterAdmin} />
}

export function EditPolicyRole() {
    return <EditPolicy yaml={editPolicyRole} />
}

export function EditPolicyRoleBinding() {
    return <EditPolicy yaml={editPolicyRoleBinding} />
}

export function EditPolicyComplianceOperatorInstall() {
    return <EditPolicy yaml={editPolicyComplianceOperatorInstall} />
}

export function EditPolicyComplianceOperatorCisScan() {
    return <EditPolicy yaml={editPolicyComplianceOperatorCisScan} />
}

export function EditPolicyComplianceOperatorE8Scan() {
    return <EditPolicy yaml={editPolicyComplianceOperatorE8Scan} />
}

export function EditPolicyGatekeeperOperatorDownstream() {
    return <EditPolicy yaml={editPolicyGatekeeperOperatorDownstream} />
}

export function EditPolicyNamespace() {
    return <EditPolicy yaml={editPolicyNamespace} />
}

export function EditPolicyPod() {
    return <EditPolicy yaml={editPolicyPod} />
}

export function EditPolicyCertificate() {
    return <EditPolicy yaml={editPolicyCertificate} />
}

export function EditPolicyEtcdEncryption() {
    return <EditPolicy yaml={editPolicyEtcdEncryption} />
}

export function EditPolicyLimitMemory() {
    return <EditPolicy yaml={editPolicyLimitMemory} />
}

export function EditPolicyImageManifestVuln() {
    return <EditPolicy yaml={editPolicyImageManifestVuln} />
}

export function EditPolicyPsp() {
    return <EditPolicy yaml={editPolicyPsp} />
}

export function EditPolicyScc() {
    return <EditPolicy yaml={editPolicyScc} />
}
