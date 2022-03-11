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
    IResource,
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
                (secret: Secret) => secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
            ),
        [secrets]
    )

    // TODO If no credentials then wizard needs to have link to creds page
    return (
        <PolicyAutomationWizard
            title={t('Create policy automation')}
            policy={currentPolicy ?? {}}
            credentials={credentials}
            resource={
                {
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
                } as PolicyAutomation
            }
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(data) => {
                const resource = data as IResource
                return reconcileResources([resource], []).then(() => {
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
            // TODO credential should be Secret type not IResource
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
