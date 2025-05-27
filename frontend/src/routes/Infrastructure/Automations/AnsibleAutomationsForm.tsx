/* Copyright Contributors to the Open Cluster Management project */
import {
  ActionGroup,
  Button,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  Modal,
  ModalVariant,
  Radio,
  SelectOption,
} from '@patternfly/react-core'
import { SelectVariant } from '../../../components/AcmSelectBase'
import { Fragment, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { useParams, useNavigate, useMatch } from 'react-router-dom-v5-compat'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData, LinkType, Section } from '../../../components/AcmFormData'
import { AutomationProviderHint } from '../../../components/AutomationProviderHint'
import { CreateCredentialModal } from '../../../components/CreateCredentialModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { useProjects } from '../../../hooks/useProjects'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { validateKubernetesDnsName } from '../../../lib/validation'
import { NavigationPath } from '../../../NavigationPath'
import { AcmHelperTextPrompt } from '../../../ui-components/AcmHelperTextPrompt/AcmHelperTextPrompt'
import {
  ClusterCurator,
  ClusterCuratorAnsibleJob,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  getClusterCurator,
  IResource,
  ProviderConnection,
  Secret,
} from '../../../resources'
import {
  createResource,
  isRequestAbortedError,
  listAnsibleTowerInventories,
  listAnsibleTowerJobs,
  replaceResource,
  ResourceErrorCode,
} from '../../../resources/utils'
import { useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import {
  AcmAnsibleTagsInput,
  AcmChip,
  AcmChipGroup,
  AcmForm,
  AcmKubernetesLabelsInput,
  AcmModal,
  AcmSelect,
  AcmSubmit,
  Provider,
} from '../../../ui-components'
import { CredentialsForm } from '../../Credentials/CredentialsForm'
import get from 'lodash/get'
import schema from './schema.json'
import { LostChangesContext } from '../../../components/LostChanges'

export default function AnsibleAutomationsFormPage() {
  const params = useParams()
  const { name = '', namespace = '' } = params
  const hasEditPath = !!useMatch(NavigationPath.editAnsibleAutomation)
  let isEditing = false
  let isViewing = false
  if (params.name !== undefined) {
    isEditing = hasEditPath
    isViewing = !isEditing
  }

  const [error, setError] = useState<Error>()
  const [clusterCuratorTemplate, setClusterCuratorTemplate] = useState<ClusterCurator | undefined>()
  const { ansibleCredentialsValue } = useSharedSelectors()
  const ansibleCredentials = useRecoilValue(ansibleCredentialsValue)

  useEffect(() => {
    if (isEditing || isViewing) {
      const result = getClusterCurator({ name, namespace })
      result.promise
        .then((curator) => {
          setClusterCuratorTemplate(curator)
        })
        .catch((error) => {
          if (!isRequestAbortedError(error)) {
            setError(error)
          }
        })
      return result.abort
    }
    return undefined
  }, [isEditing, isViewing, name, namespace])

  if (error) return <ErrorPage error={error} />

  if (isEditing || isViewing) {
    if (!clusterCuratorTemplate) return <LoadingPage />
    return (
      <AnsibleAutomationsForm
        ansibleCredentials={ansibleCredentials}
        clusterCurator={clusterCuratorTemplate}
        isEditing={isEditing}
        isViewing={isViewing}
      />
    )
  } else {
    // TODO: Can we create templates without an ansible secret linked?
    // Where do we store the template in this scenario?
    return (
      <AnsibleAutomationsForm
        ansibleCredentials={ansibleCredentials}
        clusterCurator={clusterCuratorTemplate}
        isEditing={false}
        isViewing={false}
      />
    )
  }
}

export function AnsibleAutomationsForm(props: {
  ansibleCredentials: ProviderConnection[]
  clusterCurator: ClusterCurator | undefined
  isEditing: boolean
  isViewing: boolean
}) {
  const { t } = useTranslation()
  const { ansibleCredentials, clusterCurator, isEditing, isViewing } = props
  const { settingsState } = useSharedAtoms()
  const settings = useRecoilValue(settingsState)
  const { clusterCuratorSupportedCurationsValue } = useSharedSelectors()
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)

  const navigate = useNavigate()
  const [forceErrors, setForceErrors] = useState(false)
  const [editAnsibleJob, setEditAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
  const [editAnsibleJobList, setEditAnsibleJobList] = useState<{
    jobs: ClusterCuratorAnsibleJob[]
    setJobs: (jobs: ClusterCuratorAnsibleJob[]) => void
  }>()
  const [templateName, setTemplateName] = useState(clusterCurator?.metadata.name ?? '')
  const [ansibleSelection, setAnsibleSelection] = useState(clusterCurator?.spec?.install?.towerAuthSecret ?? '')
  const [ansibleInventory, setAnsibleInventory] = useState(clusterCurator?.spec?.inventory ?? '')
  const [ansibleTowerInventoryList, setAnsibleTowerInventoryList] = useState<
    { name: string; description?: string; id: string }[]
  >([])

  const [ansibleTowerJobTemplateList, setAnsibleTowerJobTemplateList] = useState<
    { name: string; description?: string; id: string }[] | undefined
  >()
  const [ansibleTowerWorkflowTemplateList, setAnsibleTowerWorkflowTemplateList] =
    useState<{ name: string; description?: string; id: string }[]>()
  const [AnsibleTowerAuthError, setAnsibleTowerAuthError] = useState('')

  const [installPreJobs, setInstallPreJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.install?.prehook ?? []
  )
  const [installPostJobs, setInstallPostJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.install?.posthook ?? []
  )
  const [upgradePreJobs, setUpgradePreJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.upgrade?.prehook ?? []
  )
  const [upgradePostJobs, setUpgradePostJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.upgrade?.posthook ?? []
  )
  const [scalePreJobs, setScalePreJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.scale?.prehook ?? []
  )
  const [scalePostJobs, setScalePostJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.scale?.posthook ?? []
  )
  const [destroyPreJobs, setDestroyPreJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.destroy?.prehook ?? []
  )
  const [destroyPostJobs, setDestroyPostJobs] = useState<ClusterCuratorAnsibleJob[]>(
    clusterCurator?.spec?.destroy?.posthook ?? []
  )

  const resourceVersion: string | undefined = clusterCurator?.metadata.resourceVersion ?? undefined

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSecret, setNewSecret] = useState<Secret>()
  const { projects } = useProjects()

  useEffect(() => {
    if (newSecret) {
      setAnsibleSelection(newSecret.metadata.name as string)
    }
  }, [newSecret])

  useEffect(() => {
    // clear error and lists before fetching
    setAnsibleTowerAuthError('')
    setAnsibleTowerJobTemplateList([])
    setAnsibleTowerWorkflowTemplateList([])
    setAnsibleTowerInventoryList([])

    if (ansibleSelection) {
      const selectedCred = ansibleCredentials.find((credential) => credential.metadata.name === ansibleSelection)
      const inventoryList: { name: string; description?: string; id: string }[] | undefined = []
      const jobList: { name: string; description?: string; id: string }[] = []
      const workflowList: { name: string; description?: string; id: string }[] = []
      Promise.all([
        listAnsibleTowerJobs(selectedCred?.stringData?.host!, selectedCred?.stringData?.token!).promise.then(
          (response) => {
            if (response) {
              response.results.forEach((template) => {
                if (template.type === 'job_template' && template.name) {
                  jobList.push({
                    name: template.name,
                    description: template.description,
                    id: template.id,
                  })
                } else if (template.type === 'workflow_job_template' && template.name) {
                  workflowList.push({
                    name: template.name,
                    description: template.description,
                    id: template.id,
                  })
                }
              })
              setAnsibleTowerJobTemplateList(jobList)
              setAnsibleTowerWorkflowTemplateList(workflowList)
            }
          }
        ),
        listAnsibleTowerInventories(selectedCred?.stringData?.host!, selectedCred?.stringData?.token!).promise.then(
          (response) => {
            if (response) {
              response.results.forEach((inventory) => {
                if (inventory.name) {
                  inventoryList.push({
                    name: inventory.name,
                    description: inventory?.description,
                    id: inventory.id,
                  })
                }
              })
              setAnsibleTowerInventoryList(inventoryList)
            }
          }
        ),
      ]).catch((err) => {
        setAnsibleTowerAuthError(
          err.code === ResourceErrorCode.InternalServerError && err.reason
            ? t('validate.ansible.reason', { reason: err.reason })
            : t('validate.ansible.host')
        )
        setForceErrors(true)
        // clear lists again in case only some requests failed
        setAnsibleTowerJobTemplateList([])
        setAnsibleTowerWorkflowTemplateList([])
        setAnsibleTowerInventoryList([])
      })
    }
  }, [ansibleSelection, ansibleCredentials, t])

  const { cancelForm, submitForm } = useContext(LostChangesContext)

  function updateAnsibleJob(ansibleJob?: ClusterCuratorAnsibleJob, replaceJob?: ClusterCuratorAnsibleJob) {
    if (ansibleJob && replaceJob && ansibleJob.name && editAnsibleJobList) {
      if (editAnsibleJobList.jobs.includes(replaceJob)) {
        editAnsibleJobList.setJobs(editAnsibleJobList.jobs.map((job) => (job === replaceJob ? ansibleJob : job)))
      } else {
        editAnsibleJobList.setJobs([...editAnsibleJobList.jobs, ...[ansibleJob]])
      }
    }
    setEditAnsibleJob(undefined)
  }

  function stateToData() {
    let ansibleSecretNamespace = ''
    ansibleCredentials.forEach((credential) => {
      if (ansibleSelection === credential.metadata.name) ansibleSecretNamespace = credential.metadata!.namespace!
    })
    const curator: ClusterCurator = {
      apiVersion: ClusterCuratorApiVersion,
      kind: ClusterCuratorKind,
      metadata: {
        name: templateName,
        namespace: ansibleSecretNamespace,
        resourceVersion: resourceVersion ?? '',
      },
      spec: {
        install: {
          towerAuthSecret: ansibleSelection,
          prehook: installPreJobs,
          posthook: installPostJobs,
        },
        upgrade: {
          towerAuthSecret: ansibleSelection,
          prehook: upgradePreJobs,
          posthook: upgradePostJobs,
        },
        ...(ansibleInventory ? { inventory: ansibleInventory } : {}),
        ...(settings.ansibleIntegration === 'enabled'
          ? {
              scale: {
                towerAuthSecret: ansibleSelection,
                prehook: scalePreJobs,
                posthook: scalePostJobs,
              },
              destroy: {
                towerAuthSecret: ansibleSelection,
                prehook: destroyPreJobs,
                posthook: destroyPostJobs,
              },
            }
          : {}),
      },
    }
    return curator
  }

  function setAnsibleSelections(value: any) {
    const errors: any[] = []
    let secret: SetStateAction<string> = ansibleSelection
    if (Object.keys(value).length) {
      supportedCurations.forEach((type) => {
        const path = `ClusterCurator[0].spec.${type}.towerAuthSecret`
        const testSecret = get(value, `${type}.towerAuthSecret`)
        if (!!testSecret && testSecret !== ansibleSelection) {
          if (ansibleCredentials.findIndex((cred) => get(cred, 'metadata.name') === testSecret) === -1) {
            errors.push({ path, message: t('"{{testSecret}}" is not an existing Ansible credential', { testSecret }) })
          } else {
            secret = testSecret
          }
        }
      })
      if (!errors.length) {
        setAnsibleSelection(secret)
      }
    }
    return errors
  }

  function setAnsibleInventorySelection(testInventory: any) {
    const errors: any[] = []
    let selectedInventory: SetStateAction<string> = ansibleInventory
    if (testInventory !== ansibleInventory) {
      if (!!testInventory && ansibleTowerInventoryList.findIndex(({ name }) => name === testInventory) === -1) {
        errors.push({
          path: `ClusterCurator[0].spec.inventory`,
          message: t('{{testInventory}} is not an existing Ansible inventory', { testInventory }),
        })
      } else {
        selectedInventory = testInventory
      }
    }
    if (!errors.length) {
      setAnsibleInventory(selectedInventory)
    }
    return errors
  }

  function setCustomHook(type: string, preHook: boolean, value: any) {
    const errors: any[] = []
    if (Array.isArray(value)) {
      value.forEach(({ type: jobType, name: valueName }, index) => {
        const path = `ClusterCurator[0].spec.${type}.${preHook ? 'prehook' : 'posthook'}.${index}`
        if (!['Job', 'Workflow'].includes(jobType)) {
          errors.push({ path: `${path}.type`, message: t('Must be Job or Workflow') })
        }
        if (valueName) {
          if (
            jobType === 'Job' &&
            ansibleTowerJobTemplateList &&
            ansibleTowerJobTemplateList.findIndex(({ name }) => valueName === name) === -1
          ) {
            errors.push({ path: `${path}.name`, message: t('"{{name}}" is not an existing Ansible job', { name }) })
          } else if (
            jobType === 'Workflow' &&
            ansibleTowerWorkflowTemplateList &&
            ansibleTowerWorkflowTemplateList.findIndex(({ name }) => valueName === name) === -1
          ) {
            errors.push({
              path: `${path}.name`,
              message: t('"{{name}}" is not an existing Ansible workflow', { valueName }),
            })
          }
        }
      })
      if (!errors.length) {
        if (preHook) {
          switch (type) {
            case 'install':
              setInstallPreJobs(value)
              break
            case 'upgrade':
              setUpgradePreJobs(value)
              break
            case 'scale':
              setScalePreJobs(value)
              break
            case 'destroy':
              setDestroyPreJobs(value)
              break
          }
        } else {
          switch (type) {
            case 'install':
              setInstallPostJobs(value)
              break
            case 'upgrade':
              setUpgradePostJobs(value)
              break
            case 'scale':
              setScalePostJobs(value)
              break
            case 'destroy':
              setDestroyPostJobs(value)
              break
          }
        }
        return undefined
      }
    }
    return errors
  }

  function stateToSyncs() {
    let syncs: any = [
      { path: 'ClusterCurator[0].metadata.name', setState: setTemplateName },
      { path: 'ClusterCurator[0].spec.inventory', setter: setAnsibleInventorySelection.bind(null) },
      { path: 'ClusterCurator[0].spec', setter: setAnsibleSelections.bind(null) },
    ]
    supportedCurations.forEach((type) => {
      syncs = [
        ...syncs,
        { path: `ClusterCurator[0].spec.${type}.prehook`, setter: setCustomHook.bind(null, type, true) },
        { path: `ClusterCurator[0].spec.${type}.posthook`, setter: setCustomHook.bind(null, type, false) },
      ]
    })
    return syncs
  }

  function cellsFn(ansibleJob: ClusterCuratorAnsibleJob) {
    return [
      <Flex style={{ gap: '8px' }} key={ansibleJob.name}>
        <FlexItem>
          <Label color="blue">{ansibleJob.type === 'Job' ? t('Job') : t('Workflow')}</Label>
        </FlexItem>
        <FlexItem>{ansibleJob.name}</FlexItem>
        {ansibleJob.extra_vars && (
          <AcmChipGroup aria-label={t('Extra variables')}>
            {Object.keys(ansibleJob.extra_vars)
              .filter((key) => typeof ansibleJob.extra_vars?.[key] === 'string')
              .map((key) => (
                <AcmChip isReadOnly key={`${ansibleJob.name}-${key}`}>
                  {key}={ansibleJob.extra_vars![key]}
                </AcmChip>
              ))}
          </AcmChipGroup>
        )}
      </Flex>,
    ]
  }

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  const formData: FormData = {
    title: isEditing ? t('template.edit.title') : t('template.create.title'),
    titleTooltip: isEditing ? t('template.edit.tooltip') : t('template.create.tooltip'),
    breadcrumb: [
      { text: t('template.title'), to: NavigationPath.ansibleAutomations },
      { text: isEditing ? t('template.edit.title') : t('template.create.title') },
    ],
    reviewDescription: t('template.create.review.description'),
    reviewTitle: t('template.create.review.title'),
    cancelLabel: t('cancel'),
    nextLabel: t('next'),
    backLabel: t('back'),
    sections: [
      {
        type: 'Section',
        title: t('template.information.title'),
        wizardTitle: t('template.create.config.wizard.title'),
        inputs: [
          {
            id: 'Template',
            type: 'Text',
            label: t('template.create.name'),
            placeholder: t('template.create.placeholder'),
            value: templateName,
            onChange: setTemplateName,
            isRequired: true,
            isDisabled: isEditing,
            validation: (value) => validateKubernetesDnsName(value, t),
          },
          {
            id: 'ansibleSecrets',
            type: 'Select',
            label: t('credentialsForm.ansibleCredentials.label'),
            placeholder: t('credentialsForm.ansibleCredentials.placeholder'),
            value: ansibleSelection,
            onChange: setAnsibleSelection,
            isRequired: true,
            options: ansibleCredentials.map((credential) => ({
              id: credential.metadata.name as string,
              value: credential.metadata.name as string,
            })),
            footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
            isDisabled: isEditing,
            validation: () => {
              return AnsibleTowerAuthError || undefined
            },
          },
          {
            id: 'Inventory',
            type: 'Select',
            label: t('Ansible inventory'),
            placeholder: t('Select an inventory'),
            value: ansibleInventory,
            onChange: setAnsibleInventory,
            isRequired: false,
            options: ansibleTowerInventoryList.map(({ name, description }) => ({
              id: name as string,
              value: name as string,
              description: description,
            })),
            isHidden: !ansibleSelection,
            prompt: {
              text: t('View selected inventory'),
              linkType: LinkType.external,
              isDisabled: !ansibleInventory,
              callback: () => {
                window.open(
                  `${ansibleCredentials[0].stringData?.host}/#/inventories/inventory/${
                    ansibleTowerInventoryList.find((inv) => inv.name === ansibleInventory)?.id
                  }`
                )
              },
            },
          },
        ],
      },
      {
        type: 'SectionGroup',
        title: t('template.templates.title'),
        sections: [
          {
            type: 'Section',
            title: t('template.create.install'),
            wizardTitle: t('template.create.install.wizard.title'),
            description: t('template.information.description'),
            inputs: [
              {
                id: 'installPreJob',
                type: 'OrderedItems',
                label: t('template.preInstall.label'),
                placeholder: t('template.job.placeholder'),
                value: installPreJobs,
                onChange: setInstallPreJobs,
                keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                cellsFn,
                onEdit: (ansibleJob) => {
                  setEditAnsibleJobList({ jobs: installPreJobs, setJobs: setInstallPreJobs })
                  setEditAnsibleJob(ansibleJob)
                },
                onCreate: () => {
                  setEditAnsibleJobList({ jobs: installPreJobs, setJobs: setInstallPreJobs })
                  setEditAnsibleJob({ name: '', extra_vars: {} })
                },
              },
              {
                id: 'installPostJob',
                type: 'OrderedItems',
                label: t('template.postInstall.label'),
                placeholder: t('template.job.placeholder'),
                value: installPostJobs,
                onChange: setInstallPostJobs,
                keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                cellsFn,
                onEdit: (ansibleJob) => {
                  setEditAnsibleJobList({ jobs: installPostJobs, setJobs: setInstallPostJobs })
                  setEditAnsibleJob(ansibleJob)
                },
                onCreate: () => {
                  setEditAnsibleJobList({ jobs: installPostJobs, setJobs: setInstallPostJobs })
                  setEditAnsibleJob({ name: '', extra_vars: {} })
                },
              },
            ],
          },
          {
            type: 'Section',
            title: t('template.create.upgrade'),
            wizardTitle: t('template.create.upgrade.wizard.title'),
            description: t('template.information.description'),
            inputs: [
              {
                id: 'upgradePreJob',
                type: 'OrderedItems',
                label: t('template.preUpgrade.label'),
                placeholder: t('template.job.placeholder'),
                value: upgradePreJobs,
                onChange: setUpgradePreJobs,
                keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                cellsFn,
                onEdit: (ansibleJob) => {
                  setEditAnsibleJobList({ jobs: upgradePreJobs, setJobs: setUpgradePreJobs })
                  setEditAnsibleJob(ansibleJob)
                },
                onCreate: () => {
                  setEditAnsibleJobList({ jobs: upgradePreJobs, setJobs: setUpgradePreJobs })
                  setEditAnsibleJob({ name: '', extra_vars: {} })
                },
              },
              {
                id: 'upgradePostJob',
                type: 'OrderedItems',
                label: t('template.postUpgrade.label'),
                placeholder: t('template.job.placeholder'),
                value: upgradePostJobs,
                onChange: setUpgradePostJobs,
                keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                cellsFn,
                onEdit: (ansibleJob) => {
                  setEditAnsibleJobList({ jobs: upgradePostJobs, setJobs: setUpgradePostJobs })
                  setEditAnsibleJob(ansibleJob)
                },
                onCreate: () => {
                  setEditAnsibleJobList({ jobs: upgradePostJobs, setJobs: setUpgradePostJobs })
                  setEditAnsibleJob({ name: '', extra_vars: {} })
                },
              },
            ],
          },
          ...(settings.ansibleIntegration === 'enabled'
            ? ([
                {
                  type: 'Section',
                  title: t('template.create.scale'),
                  wizardTitle: t('template.create.scale.wizard.title'),
                  description: t('template.information.description'),
                  inputs: [
                    {
                      id: 'scalePreJob',
                      type: 'OrderedItems',
                      label: t('template.preScale.label'),
                      placeholder: t('template.job.placeholder'),
                      value: scalePreJobs,
                      onChange: setScalePreJobs,
                      keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                      summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                      cellsFn,
                      onEdit: (ansibleJob) => {
                        setEditAnsibleJobList({ jobs: scalePreJobs, setJobs: setScalePreJobs })
                        setEditAnsibleJob(ansibleJob)
                      },
                      onCreate: () => {
                        setEditAnsibleJobList({ jobs: scalePreJobs, setJobs: setScalePreJobs })
                        setEditAnsibleJob({ name: '', extra_vars: {} })
                      },
                    },
                    {
                      id: 'scalePostJob',
                      type: 'OrderedItems',
                      label: t('template.postScale.label'),
                      placeholder: t('template.job.placeholder'),
                      value: scalePostJobs,
                      onChange: setScalePostJobs,
                      keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                      summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                      cellsFn,
                      onEdit: (ansibleJob) => {
                        setEditAnsibleJobList({ jobs: scalePostJobs, setJobs: setScalePostJobs })
                        setEditAnsibleJob(ansibleJob)
                      },
                      onCreate: () => {
                        setEditAnsibleJobList({ jobs: scalePostJobs, setJobs: setScalePostJobs })
                        setEditAnsibleJob({ name: '', extra_vars: {} })
                      },
                    },
                  ],
                },
                {
                  type: 'Section',
                  title: t('template.create.destroy'),
                  wizardTitle: t('template.create.destroy.wizard.title'),
                  description: t('template.information.description'),
                  inputs: [
                    {
                      id: 'destroyPreJob',
                      type: 'OrderedItems',
                      label: t('template.preDestroy.label'),
                      placeholder: t('template.job.placeholder'),
                      value: destroyPreJobs,
                      onChange: setDestroyPreJobs,
                      keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                      summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                      cellsFn,
                      onEdit: (ansibleJob) => {
                        setEditAnsibleJobList({
                          jobs: destroyPreJobs,
                          setJobs: setDestroyPreJobs,
                        })
                        setEditAnsibleJob(ansibleJob)
                      },
                      onCreate: () => {
                        setEditAnsibleJobList({
                          jobs: destroyPreJobs,
                          setJobs: setDestroyPreJobs,
                        })
                        setEditAnsibleJob({ name: '', extra_vars: {} })
                      },
                    },
                    {
                      id: 'destroyPostJob',
                      type: 'OrderedItems',
                      label: t('template.postDestroy.label'),
                      placeholder: t('template.job.placeholder'),
                      value: destroyPostJobs,
                      onChange: setDestroyPostJobs,
                      keyFn: (_ansibleJob: ClusterCuratorAnsibleJob, index) => String(index),
                      summaryFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
                      cellsFn,
                      onEdit: (ansibleJob) => {
                        setEditAnsibleJobList({
                          jobs: destroyPostJobs,
                          setJobs: setDestroyPostJobs,
                        })
                        setEditAnsibleJob(ansibleJob)
                      },
                      onCreate: () => {
                        setEditAnsibleJobList({
                          jobs: destroyPostJobs,
                          setJobs: setDestroyPostJobs,
                        })
                        setEditAnsibleJob({ name: '', extra_vars: {} })
                      },
                    },
                  ],
                },
              ] as Section[])
            : []),
        ],
      },
    ],
    showErrors: forceErrors,
    submit: () => {
      if (isEditing) {
        return replaceResource(stateToData() as IResource).promise.then(async () => {
          if (process.env.NODE_ENV === 'development') await new Promise((resolve) => setTimeout(resolve, 4000))
          submitForm()
          navigate(NavigationPath.ansibleAutomations)
        })
      } else {
        return createResource(stateToData() as IResource).promise.then(async () => {
          if (process.env.NODE_ENV === 'development') await new Promise((resolve) => setTimeout(resolve, 4000))
          submitForm()
          navigate(NavigationPath.ansibleAutomations)
        })
      }
    },
    submitText: isEditing ? t('save') : t('add'),
    submittingText: isEditing ? t('saving') : t('adding'),
    cancel: () => {
      cancelForm()
      navigate(NavigationPath.ansibleAutomations)
    },
    stateToSyncs,
    stateToData,
  }

  return (
    <Fragment>
      <Modal
        variant={ModalVariant.large}
        showClose={false}
        isOpen={isModalOpen}
        aria-labelledby="modal-wizard-label"
        aria-describedby="modal-wizard-description"
        onClose={handleModalToggle}
        hasNoBodyWrapper
      >
        <CredentialsForm
          namespaces={projects}
          isEditing={false}
          isViewing={false}
          credentialsType={Provider.ansible}
          handleModalToggle={handleModalToggle}
          hideYaml={true}
          newCredentialCallback={setNewSecret}
        />
      </Modal>
      <AcmDataFormPage
        editorTitle={t('Ansible YAML')}
        formData={formData}
        schema={schema}
        immutables={isEditing ? ['ClusterCurator.0.metadata.name', 'ClusterCurator.0.metadata.namespace'] : []}
        mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'}
        globalWizardAlert={<AutomationProviderHint component="alert" />}
      />
      <EditAnsibleJobModal
        ansibleJob={editAnsibleJob}
        ansibleSelection={ansibleSelection}
        setAnsibleJob={updateAnsibleJob}
        ansibleCredentials={ansibleCredentials}
        ansibleTowerTemplateList={ansibleTowerJobTemplateList}
        ansibleTowerWorkflowTemplateList={ansibleTowerWorkflowTemplateList}
        ansibleJobList={editAnsibleJobList?.jobs}
      />
    </Fragment>
  )
}

function EditAnsibleJobModal(props: {
  ansibleSelection?: string
  ansibleCredentials: ProviderConnection[]
  ansibleTowerTemplateList: { name: string; description?: string; id: string }[] | undefined
  ansibleTowerWorkflowTemplateList: { name: string; description?: string; id: string }[] | undefined
  ansibleJob?: ClusterCuratorAnsibleJob
  ansibleJobList?: ClusterCuratorAnsibleJob[]
  setAnsibleJob: (ansibleJob?: ClusterCuratorAnsibleJob, old?: ClusterCuratorAnsibleJob) => void
}) {
  const { t } = useTranslation()
  const [ansibleJob, setAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
  const [filterForJobTemplates, setFilterForJobTemplates] = useState<boolean>(true)
  const [ansibleTemplateUrl, setAnsibleTemplateUrl] = useState<string>('')
  const {
    ansibleTowerTemplateList = [],
    ansibleTowerWorkflowTemplateList = [],
    ansibleSelection,
    ansibleCredentials,
  } = props

  const updateTemplateUrl = useCallback(
    (jobName: string | undefined, filterForJobTemplates: boolean) => {
      if (jobName && ansibleCredentials.length) {
        const templateType = filterForJobTemplates ? 'job_template' : 'workflow_job_template'
        const hostURL = ansibleCredentials.find((cred) => ansibleSelection === cred?.metadata?.name)?.stringData?.host
        const jobID = filterForJobTemplates
          ? ansibleTowerTemplateList.find((template) => template.name === jobName)?.id
          : ansibleTowerWorkflowTemplateList.find((template) => template.name === jobName)?.id
        setAnsibleTemplateUrl(`${hostURL}/#/templates/${templateType}/${jobID}`)
      } else {
        setAnsibleTemplateUrl('')
      }
    },
    [ansibleCredentials, ansibleTowerTemplateList, ansibleTowerWorkflowTemplateList, ansibleSelection]
  )

  const updateTemplateSelection = useCallback(
    (jobName: string | undefined) => {
      if (ansibleJob) {
        const copy = { ...ansibleJob }
        copy.name = jobName ?? ''
        copy.type = filterForJobTemplates ? 'Job' : 'Workflow'
        setAnsibleJob(copy)
      }
      updateTemplateUrl(jobName, filterForJobTemplates)
    },
    [ansibleJob, filterForJobTemplates, updateTemplateUrl]
  )

  const updateFilterForJobTemplates = useCallback(
    (filterForJobTemplates: boolean) => {
      setFilterForJobTemplates(filterForJobTemplates)
      updateTemplateSelection('')
    },
    [updateTemplateSelection]
  )

  useEffect(() => {
    const filterForJobTemplates = props.ansibleJob?.type !== 'Workflow'
    setAnsibleJob(props.ansibleJob)
    setFilterForJobTemplates(filterForJobTemplates)
    updateTemplateUrl(props.ansibleJob?.name, filterForJobTemplates)
  }, [props.ansibleJob, updateTemplateUrl])

  return (
    <AcmModal
      variant={ModalVariant.medium}
      title={props.ansibleJob?.name !== '' ? t('template.modal.title.edit') : t('template.modal.title.add')}
      isOpen={props.ansibleJob !== undefined}
      onClose={() => props.setAnsibleJob()}
      position="top"
    >
      <AcmForm>
        <FormGroup fieldId="template-type" isInline>
          <Radio
            name="job-template"
            id="job-template"
            label={t('Job template')}
            isChecked={filterForJobTemplates}
            onChange={() => updateFilterForJobTemplates(true)}
          />
          <Radio
            name={'workflow-template'}
            id={'workflow-template'}
            label={t('Workflow job template')}
            isChecked={!filterForJobTemplates}
            onChange={() => updateFilterForJobTemplates(false)}
          />
        </FormGroup>
        <AcmSelect
          maxHeight="18em"
          menuAppendTo="parent"
          label={filterForJobTemplates ? t('template.modal.name.label') : t('template.workflow.modal.name.label')}
          id="job-name"
          value={ansibleJob?.name}
          onChange={(name) => updateTemplateSelection(name)}
          variant={SelectVariant.typeahead}
          placeholder={
            filterForJobTemplates ? t('template.modal.name.placeholder') : t('template.workflow.modal.name.placeholder')
          }
          isRequired
          helperText={AcmHelperTextPrompt({
            prompt: {
              label: t('View selected template'),
              href: ansibleTemplateUrl,
              isDisabled: !ansibleTemplateUrl,
            },
          })}
        >
          {filterForJobTemplates
            ? ansibleTowerTemplateList?.map(({ name, description }) => (
                <SelectOption key={name} value={name} description={description}>
                  {name}
                </SelectOption>
              ))
            : ansibleTowerWorkflowTemplateList?.map(({ name, description }) => (
                <SelectOption key={name} value={name} description={description}>
                  {name}
                </SelectOption>
              ))}
        </AcmSelect>
        <AcmKubernetesLabelsInput
          id="job-settings"
          label={t('template.modal.settings.label')}
          value={ansibleJob?.extra_vars}
          onChange={(labels) => {
            if (ansibleJob) {
              const copy = { ...ansibleJob }
              copy.extra_vars = labels
              setAnsibleJob(copy)
            }
          }}
          placeholder={t('template.modal.settings.placeholder')}
        />
        {filterForJobTemplates && (
          <>
            <AcmAnsibleTagsInput
              id="job-jobtags"
              label={t('Job tags')}
              value={ansibleJob?.job_tags}
              onChange={(labels) => {
                if (ansibleJob) {
                  const copy = { ...ansibleJob }
                  copy.job_tags = labels
                  setAnsibleJob(copy)
                }
              }}
              placeholder={t('Enter job tag with "," or "enter"')}
            />
            <AcmAnsibleTagsInput
              id="job-skiptags"
              label={t('Skip tags')}
              value={ansibleJob?.skip_tags}
              onChange={(labels) => {
                if (ansibleJob) {
                  const copy = { ...ansibleJob }
                  copy.skip_tags = labels
                  setAnsibleJob(copy)
                }
              }}
              placeholder={t('Enter skip tag with "," or "enter"')}
            />
          </>
        )}
        {!filterForJobTemplates && (
          <AutomationProviderHint component="alert" operatorNotRequired workflowSupportRequired />
        )}

        <ActionGroup>
          <AcmSubmit
            variant="primary"
            onClick={() => {
              if (ansibleJob) props.setAnsibleJob({ ...ansibleJob }, props.ansibleJob)
              props.setAnsibleJob()
            }}
          >
            {t('Save')}
          </AcmSubmit>

          <Button variant="link" onClick={() => props.setAnsibleJob()} key="cancel">
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </AcmForm>
    </AcmModal>
  )
}
