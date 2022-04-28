/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyAutomationWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicyAutomation/PolicyAutomationWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { configMapsState, secretsState, subscriptionOperatorsState, usePolicies } from '../../../atoms'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import {
    IResource,
    listAnsibleTowerJobs,
    PolicyAutomation,
    PolicyAutomationApiVersion,
    PolicyAutomationKind,
    reconcileResources,
    Secret,
    SubscriptionOperator,
} from '../../../resources'
import schema from './schemaAutomation.json'

export function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    return (
        <SyncEditor
            editorTitle={'Automation YAML'}
            variant="toolbar"
            resources={resources}
            schema={schema}
            onEditorChange={(changes: { resources: any[]; errors: any[]; changes: any[] }): void => {
                update(changes?.resources)
            }}
        />
    )
}

function getWizardSyncEditor() {
    return <WizardSyncEditor />
}

export function CreatePolicyAutomation() {
    const { t } = useTranslation()
    const params = useParams<{ namespace: string; name: string }>()
    const { name, namespace } = params
    const toast = useContext(AcmToastContext)
    const history = useHistory()
    const policies = usePolicies()
    const [secrets] = useRecoilState(secretsState)
    const [configMaps] = useRecoilState(configMapsState)
    const [subscriptionOperators] = useRecoilState(subscriptionOperatorsState)
    const currentPolicy = useMemo(
        () => policies.find((policy) => policy.metadata.name === name && policy.metadata.namespace === namespace),
        [policies, name, namespace]
    )

    const isOperatorInstalled = useMemo(() => {
        const ansibleOp = subscriptionOperators.filter((op: SubscriptionOperator) => {
            const conditions = op.status?.conditions[0]
            return (
                op.metadata.name === 'ansible-automation-platform-operator' &&
                conditions?.reason === 'AllCatalogSourcesHealthy'
            )
        })
        return ansibleOp.length > 0
    }, [subscriptionOperators])

    const credentials = useMemo(
        () =>
            secrets.filter(
                (secret: Secret) =>
                    secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                    !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromNamespace'] &&
                    !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
            ),
        [secrets]
    )

    return (
        <PolicyAutomationWizard
            title={t('Create policy automation')}
            policy={currentPolicy ?? {}}
            yamlEditor={getWizardSyncEditor}
            credentials={credentials}
            createCredentialsCallback={() => window.open(NavigationPath.addCredentials)}
            isAnsibleOperatorInstalled={isOperatorInstalled}
            configMaps={configMaps}
            resource={{
                kind: PolicyAutomationKind,
                apiVersion: PolicyAutomationApiVersion,
                metadata: {
                    name: `${currentPolicy?.metadata?.name ?? ''}-policy-automation`.substring(0, 253),
                    namespace: currentPolicy?.metadata?.namespace ?? '',
                },
                spec: {
                    policyRef: currentPolicy?.metadata?.name ?? '',
                    mode: 'once',
                    automationDef: { name: '', secret: '', type: 'AnsibleJob' },
                },
            }}
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(data) => {
                const resource = data as PolicyAutomation
                const resources: IResource[] = [resource]
                if (resource) {
                    // Copy the cedential to the namespace of the policy
                    const credToCopy: Secret[] = secrets.filter(
                        (secret: Secret) =>
                            secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                            secret.metadata.name === resource.spec.automationDef.secret
                    )
                    const credExists = credToCopy.find(
                        (cred) => cred.metadata.namespace === resource.metadata.namespace
                    )
                    if (!credExists) {
                        // unshift so secret is created before the PolicyAutomation
                        resources.unshift({
                            ...credToCopy[0],
                            metadata: {
                                annotations: credToCopy[0].metadata.annotations,
                                name: credToCopy[0].metadata.name,
                                namespace: resource.metadata.namespace!,
                                labels: {
                                    'cluster.open-cluster-management.io/type': 'ans',
                                    'cluster.open-cluster-management.io/copiedFromNamespace':
                                        resource.metadata.namespace!,
                                    'cluster.open-cluster-management.io/copiedFromSecretName': resource.metadata.name!,
                                },
                            },
                        })
                    }
                }
                return reconcileResources(resources, []).then(() => {
                    if (resource) {
                        toast.addAlert({
                            title: t('Policy automation created'),
                            message: t('{{name}} was successfully created.', { name: resource.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(window.history?.state?.state?.from ?? NavigationPath.policies)
                })
            }}
            getAnsibleJobsCallback={async (credential: any) => {
                const host = Buffer.from(credential.data.host || '', 'base64').toString('ascii')
                const token = Buffer.from(credential.data.token || '', 'base64').toString('ascii')

                return listAnsibleTowerJobs(host, token).promise.then((response) => {
                    let templateList: string[] = []
                    if (response?.results) {
                        templateList = response.results!.map((job) => job.name!)
                    }
                    return templateList
                })
            }}
        />
    )
}
