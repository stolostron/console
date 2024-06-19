/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyAutomationWizard } from '../../../wizards/Governance/PolicyAutomation/PolicyAutomationWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useMemo } from 'react'
import { useParams, useNavigate, PathParam, useLocation } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { listAnsibleTowerJobs, PolicyAutomationApiVersion, PolicyAutomationKind, Secret } from '../../../resources'
import { handlePolicyAutomationSubmit } from '../common/util'
import schema from './schemaAutomation.json'
import { LostChangesContext } from '../../../components/LostChanges'

export function WizardSyncEditor() {
  const resources = useItem() // Wizard framework sets this context
  const { update } = useData() // Wizard framework sets this context
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Automation YAML')}
      variant="toolbar"
      resources={resources}
      schema={schema}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      autoCreateNs
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function CreatePolicyAutomation() {
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.createPolicyAutomation>>()
  const { configMapsState, secretsState, usePolicies } = useSharedAtoms()
  const navigate = useNavigate()
  const policies = usePolicies()
  const secrets = useRecoilValue(secretsState)
  const configMaps = useRecoilValue(configMapsState)
  const toast = useContext(AcmToastContext)
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

  const { cancelForm, submitForm } = useContext(LostChangesContext)
  const { state } = useLocation()
  const destination = state?.from ?? NavigationPath.policies

  return (
    <PolicyAutomationWizard
      title={t('Create policy automation')}
      policy={currentPolicy ?? {}}
      yamlEditor={getWizardSyncEditor}
      breadcrumb={[
        { text: t('Policies'), to: NavigationPath.policies },
        {
          text: name,
          to: NavigationPath.policyDetails.replace(':namespace', namespace).replace(':name', name),
        },
        { text: t('Create policy automation') },
      ]}
      credentials={credentials}
      createCredentialsCallback={() => window.open(NavigationPath.addCredentials)}
      configMaps={configMaps}
      resource={{
        kind: PolicyAutomationKind,
        apiVersion: PolicyAutomationApiVersion,
        metadata: {
          name: `${name ?? ''}-policy-automation`.substring(0, 253),
          namespace: namespace ?? '',
        },
        spec: {
          policyRef: name ?? '',
          mode: 'once',
          automationDef: { name: '', secret: '', type: 'AnsibleJob' },
        },
      }}
      onCancel={() => {
        cancelForm()
        navigate(destination)
      }}
      onSubmit={(data) => handlePolicyAutomationSubmit(submitForm, data, secrets, navigate, destination, toast, t)}
      getAnsibleJobsCallback={async (credential: any) => {
        const host = Buffer.from(credential.data.host || '', 'base64').toString('ascii')
        const token = Buffer.from(credential.data.token || '', 'base64').toString('ascii')

        return listAnsibleTowerJobs(host, token).promise.then((response) => {
          let templateList: { name: string; description?: string; id: string }[] = []
          if (response?.results) {
            templateList = response.results!.map((job) => ({
              name: job.name,
              description: job.description,
              id: job.id,
            }))
          }
          return templateList
        })
      }}
    />
  )
}
