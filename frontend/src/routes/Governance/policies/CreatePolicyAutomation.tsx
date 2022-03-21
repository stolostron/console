/* Copyright Contributors to the Open Cluster Management project */
import { PolicyAutomationWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicyAutomation/PolicyAutomationWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState, usePolicies } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import {
    createResource,
    listAnsibleTowerJobs,
    PolicyAutomation,
    PolicyAutomationApiVersion,
    PolicyAutomationKind,
    reconcileResources,
    Secret,
} from '../../../resources'

export function CreatePolicyAutomation() {
    const { t } = useTranslation()
    const params = useParams<{ namespace: string; name: string }>()
    const { name, namespace } = params
    const toast = useContext(AcmToastContext)
    const history = useHistory()
    const policies = usePolicies()
    const [secrets] = useRecoilState(secretsState)
    const currentPolicy = useMemo(
        () => policies.find((policy) => policy.metadata.name === name && policy.metadata.namespace === namespace),
        [policies, name, namespace]
    )
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
            credentials={credentials}
            createCredentialsCallback={() => window.open(NavigationPath.addCredentials)}
            resource={{
                kind: PolicyAutomationKind,
                apiVersion: PolicyAutomationApiVersion,
                metadata: {
                    name: `${currentPolicy?.metadata?.name ?? ''}-policy-automation`,
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
                return reconcileResources([resource], []).then(() => {
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
                            createResource<Secret>({
                                ...credToCopy[0],
                                metadata: {
                                    annotations: credToCopy[0].metadata.annotations,
                                    name: credToCopy[0].metadata.name,
                                    namespace: resource.metadata.namespace!,
                                    labels: {
                                        'cluster.open-cluster-management.io/type': 'ans',
                                        'cluster.open-cluster-management.io/copiedFromNamespace':
                                            resource.metadata.namespace!,
                                        'cluster.open-cluster-management.io/copiedFromSecretName':
                                            resource.metadata.name!,
                                    },
                                },
                            })
                        }
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

                return new Promise((resolve, reject) => {
                    const ansibleJobs = listAnsibleTowerJobs(host, token)
                    ansibleJobs.promise
                        .then((response) => {
                            if (response) {
                                let templateList: string[] = []
                                if (response?.results) {
                                    templateList = response.results!.map((job) => job.name!)
                                }
                                resolve(templateList)
                            }
                        })
                        .catch(() => {
                            reject('Error getting Anisble jobs')
                        })
                })
            }}
        />
    )
}
