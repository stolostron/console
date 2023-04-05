/* Copyright Contributors to the Open Cluster Management project */
import {
  ActionGroup,
  Button,
  Chip,
  ChipGroup,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  Modal,
  ModalVariant,
  Radio,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData, Section } from '../../../components/AcmFormData'
import { AutomationProviderHint } from '../../../components/AutomationProviderHint'
import { CreateCredentialModal } from '../../../components/CreateCredentialModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { GetProjects } from '../../../components/GetProjects'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { validateKubernetesDnsName } from '../../../lib/validation'
import { NavigationPath } from '../../../NavigationPath'
import {
  ClusterCurator,
  ClusterCuratorAnsibleJob,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  createResource,
  getClusterCurator,
  IResource,
  listAnsibleTowerInventories,
  listAnsibleTowerJobs,
  ProviderConnection,
  replaceResource,
  ResourceErrorCode,
  Secret,
} from '../../../resources'
import { useRecoilState, useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import {
  AcmAnsibleTagsInput,
  AcmForm,
  AcmKubernetesLabelsInput,
  AcmModal,
  AcmSelect,
  AcmSubmit,
  Provider,
} from '../../../ui-components'
import { CredentialsForm } from '../../Credentials/CredentialsForm'
import schema from './schema.json'

export default function AnsibleAutomationsFormPage({
  match,
}: RouteComponentProps<{ namespace: string; name: string }>) {
  const { name, namespace } = match.params

  let isEditing = false
  let isViewing = false
  if (name !== undefined) {
    isEditing = match.path.endsWith(NavigationPath.editAnsibleAutomation)
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
        .catch(setError)
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
  const [settings] = useRecoilState(settingsState)

  const history = useHistory()
  const [editAnsibleJob, setEditAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
  const [editAnsibleJobList, setEditAnsibleJobList] = useState<{
    jobs: ClusterCuratorAnsibleJob[]
    setJobs: (jobs: ClusterCuratorAnsibleJob[]) => void
  }>()
  const [templateName, setTemplateName] = useState(clusterCurator?.metadata.name ?? '')
  const [ansibleSelection, setAnsibleSelection] = useState(clusterCurator?.spec?.install?.towerAuthSecret ?? '')
  const [ansibleInventory, setAnsibleInventory] = useState(clusterCurator?.spec?.inventory ?? '')
  const [ansibleTowerInventoryList, setAnsibleTowerInventoryList] = useState<string[]>([])

  const [AnsibleTowerJobTemplateList, setAnsibleTowerJobTemplateList] = useState<string[]>()
  const [AnsibleTowerWorkflowTemplateList, setAnsibleTowerWorkflowTemplateList] = useState<string[]>()
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
  const { projects } = GetProjects()

  useEffect(() => {
    if (newSecret) {
      setAnsibleSelection(newSecret.metadata.name as string)
    }
  }, [newSecret])

  useEffect(() => {
    if (ansibleSelection) {
      const selectedCred = ansibleCredentials.find((credential) => credential.metadata.name === ansibleSelection)
      const inventoryList: string[] = []
      const jobList: string[] = []
      const workflowList: string[] = []
      Promise.all([
        listAnsibleTowerJobs(selectedCred?.stringData?.host!, selectedCred?.stringData?.token!).promise.then(
          (response) => {
            if (response) {
              response.results.forEach((template) => {
                if (template.type === 'job_template' && template.name) {
                  jobList.push(template.name)
                } else if (template.type === 'workflow_job_template' && template.name) {
                  workflowList.push(template.name)
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
                  inventoryList.push(inventory.name)
                }
              })
              setAnsibleTowerInventoryList(inventoryList)
            }
          }
        ),
      ])
        .then(() => {
          setAnsibleTowerAuthError('')
        })
        .catch((err) => {
          console.log('CAUGHT THE ERROR')
          console.log(err)
          setAnsibleTowerAuthError(
            err.code === ResourceErrorCode.InternalServerError && err.reason
              ? t('validate.ansible.reason', { reason: err.reason })
              : t('validate.ansible.host')
          )
          setAnsibleTowerJobTemplateList([])
          setAnsibleTowerWorkflowTemplateList([])
          setAnsibleTowerInventoryList([])
        })
    }
  }, [ansibleSelection, ansibleCredentials, t])

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
  function stateToSyncs() {
    const syncs = [{ path: 'ClusterCurator[0].metadata.name', setState: setTemplateName }]
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
          <ChipGroup>
            {Object.keys(ansibleJob.extra_vars).map((key) => (
              <Chip isReadOnly key={`${ansibleJob.name}-${key}`}>
                {key}={ansibleJob.extra_vars![key]}
              </Chip>
            ))}
          </ChipGroup>
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
              if (AnsibleTowerAuthError) return AnsibleTowerAuthError
            },
            validate: !!AnsibleTowerAuthError,
          },
          {
            id: 'Inventory',
            type: 'Select',
            label: t('Ansible inventory'),
            placeholder: t('Select an inventory'),
            value: ansibleInventory,
            onChange: setAnsibleInventory,
            isRequired: false,
            options: ansibleTowerInventoryList.map((name) => ({
              id: name as string,
              value: name as string,
            })),
            isHidden: !ansibleSelection,
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
    submit: () => {
      if (isEditing) {
        return replaceResource(stateToData() as IResource).promise.then(async () => {
          if (process.env.NODE_ENV === 'development') await new Promise((resolve) => setTimeout(resolve, 4000))
          history.push(NavigationPath.ansibleAutomations)
        })
      } else {
        return createResource(stateToData() as IResource).promise.then(async () => {
          if (process.env.NODE_ENV === 'development') await new Promise((resolve) => setTimeout(resolve, 4000))
          history.push(NavigationPath.ansibleAutomations)
        })
      }
    },
    submitText: isEditing ? t('save') : t('add'),
    submittingText: isEditing ? t('saving') : t('adding'),
    cancel: () => history.push(NavigationPath.ansibleAutomations),
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
        ansibleTowerTemplateList={AnsibleTowerJobTemplateList}
        ansibleTowerWorkflowTemplateList={AnsibleTowerWorkflowTemplateList}
        ansibleJobList={editAnsibleJobList?.jobs}
      />
    </Fragment>
  )
}

function EditAnsibleJobModal(props: {
  ansibleSelection?: string
  ansibleCredentials: ProviderConnection[]
  ansibleTowerTemplateList: string[] | undefined
  ansibleTowerWorkflowTemplateList: string[] | undefined
  ansibleJob?: ClusterCuratorAnsibleJob
  ansibleJobList?: ClusterCuratorAnsibleJob[]
  setAnsibleJob: (ansibleJob?: ClusterCuratorAnsibleJob, old?: ClusterCuratorAnsibleJob) => void
}) {
  const { t } = useTranslation()
  const [ansibleJob, setAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
  const [filterForJobTemplates, setFilterForJobTemplates] = useState(true)
  const { ansibleTowerTemplateList = [], ansibleTowerWorkflowTemplateList = [] } = props
  useEffect(() => setAnsibleJob(props.ansibleJob), [props.ansibleJob])

  const newTemplateSelection = (jobName: string | undefined) => {
    if (ansibleJob) {
      const copy = { ...ansibleJob }
      copy.name = jobName as string
      copy.type = filterForJobTemplates ? 'Job' : 'Workflow'
      setAnsibleJob(copy)
    }
  }

  const clearTemplateName = () => {
    if (ansibleJob) {
      const copy = { ...ansibleJob }
      copy.name = ''
      setAnsibleJob(copy)
    }
  }
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
            onChange={() => {
              setFilterForJobTemplates(true)
              clearTemplateName()
            }}
          />
          <Radio
            name={'workflow-template'}
            id={'workflow-template'}
            label={t('Workflow job template')}
            isChecked={!filterForJobTemplates}
            onChange={() => {
              setFilterForJobTemplates(false)
              clearTemplateName()
            }}
          />
        </FormGroup>
        <AcmSelect
          maxHeight="18em"
          menuAppendTo="parent"
          label={filterForJobTemplates ? t('template.modal.name.label') : t('template.workflow.modal.name.label')}
          id="job-name"
          value={ansibleJob?.name}
          onChange={(name) => {
            newTemplateSelection(name)
          }}
          variant={SelectVariant.typeahead}
          placeholder={
            filterForJobTemplates ? t('template.modal.name.placeholder') : t('template.workflow.modal.name.placeholder')
          }
          isRequired
        >
          {filterForJobTemplates
            ? ansibleTowerTemplateList?.map((name) => (
                <SelectOption key={name} value={name}>
                  {name}
                </SelectOption>
              ))
            : ansibleTowerWorkflowTemplateList?.map((name) => (
                <SelectOption key={name} value={name}>
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
