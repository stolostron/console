/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyAutomationWizard } from '../../../wizards/Governance/PolicyAutomation/PolicyAutomationWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useMemo } from 'react'
import { useParams, useNavigate, generatePath, PathParam, useLocation } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { LoadingPage } from '../../../components/LoadingPage'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { PolicyAutomation, Secret } from '../../../resources'
import { listAnsibleTowerJobs } from '../../../resources/utils'
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
      filters={['*.metadata.managedFields']}
      resources={resources}
      schema={schema}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}

export function EditPolicyAutomation() {
  const { t } = useTranslation()
  const { name = '', namespace = '' } = useParams<PathParam<NavigationPath.editPolicyAutomation>>()
  const navigate = useNavigate()
  const { configMapsState, policyAutomationState, secretsState, usePolicies } = useSharedAtoms()
  const policies = usePolicies()
  const secrets = useRecoilValue(secretsState)
  const configMaps = useRecoilValue(configMapsState)
  const policyAutomations = useRecoilValue(policyAutomationState)
  const toast = useContext(AcmToastContext)
  const currentPolicy = useMemo(
    () => policies.find((policy) => policy.metadata.name === name && policy.metadata.namespace === namespace),
    [policies, name, namespace]
  )

  const currentPolicyAutomation = policyAutomations.find((policyAutomation: PolicyAutomation) => {
    return (
      policyAutomation.metadata.name!.replace('-policy-automation', '') === name &&
      policyAutomation.metadata.namespace === namespace
    )
  })
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

  if (currentPolicyAutomation === undefined) {
    return <LoadingPage />
  }

  return (
    <PolicyAutomationWizard
      title={t('Edit policy automation')}
      editMode={EditMode.Edit}
      policy={currentPolicy ?? {}}
      yamlEditor={getWizardSyncEditor}
      breadcrumb={[
        { text: t('Policies'), to: NavigationPath.policies },
        {
          text: name ?? '',
          to: generatePath(NavigationPath.policyDetails, { name, namespace }),
        },
        { text: t('Edit policy automation') },
      ]}
      credentials={credentials}
      createCredentialsCallback={() => window.open(NavigationPath.addCredentials)}
      resource={currentPolicyAutomation}
      onCancel={() => {
        cancelForm()
        navigate(destination)
      }}
      configMaps={configMaps}
      onSubmit={(data) =>
        handlePolicyAutomationSubmit(
          submitForm,
          data,
          secrets,
          navigate,
          destination,
          toast,
          t,
          currentPolicyAutomation
        )
      }
      getAnsibleJobsCallback={async (credential: any) => {
        const host = Buffer.from(credential.data.host || '', 'base64').toString('ascii')
        const token = Buffer.from(credential.data.token || '', 'base64').toString('ascii')

        return new Promise((resolve, reject) => {
          const ansibleJobs = listAnsibleTowerJobs(host, token)
          ansibleJobs.promise
            .then((response) => {
              if (response) {
                let templateList: { name: string; description?: string; id: string }[] = []
                if (response?.results) {
                  templateList = response.results!.map((job) => ({
                    name: job.name,
                    description: job.description,
                    id: job.id,
                  }))
                }
                resolve(templateList)
              }
            })
            .catch(() => {
              reject(t('Error getting Ansible jobs'))
            })
        })
      }}
    />
  )
}
