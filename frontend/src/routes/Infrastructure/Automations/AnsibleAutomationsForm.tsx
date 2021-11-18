/* Copyright Contributors to the Open Cluster Management project */
import { AcmForm, AcmLabelsInput, AcmModal, AcmSelect, AcmSubmit } from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    Button,
    Chip,
    ChipGroup,
    Flex,
    FlexItem,
    ModalVariant,
    SelectOption,
    SelectVariant,
} from '@patternfly/react-core'
import {
    ClusterCurator,
    ClusterCuratorAnsibleJob,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    createResource,
    getClusterCurator,
    IResource,
    ProviderConnection,
    replaceResource,
    unpackProviderConnection,
    listAnsibleTowerJobs,
} from '../../../resources'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { secretsState, settingsState } from '../../../atoms'
import { AcmDataFormPage } from '../../../components/AcmDataForm'
import { FormData, LinkType, Section } from '../../../components/AcmFormData'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { validateKubernetesDnsName } from '../../../lib/validation'
import { NavigationPath } from '../../../NavigationPath'
import _ from 'lodash'

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
    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const [clusterCuratorTemplate, setClusterCuratorTemplate] = useState<ClusterCurator | undefined>()

    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )

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

    const [settings] = useRecoilState(settingsState)

    const history = useHistory()
    const [editAnsibleJob, setEditAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
    const [editAnsibleJobList, setEditAnsibleJobList] =
        useState<{ jobs: ClusterCuratorAnsibleJob[]; setJobs: (jobs: ClusterCuratorAnsibleJob[]) => void }>()
    const [templateName, setTemplateName] = useState(clusterCurator?.metadata.name ?? '')
    const [ansibleSelection, setAnsibleSelection] = useState(clusterCurator?.spec?.install?.towerAuthSecret ?? '')
    const [AnsibleTowerJobTemplateList, setAnsibleTowerJobTemplateList] = useState<string[]>()
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

    useEffect(() => {
        if (ansibleSelection) {
            const selectedCred = ansibleCredentials.find((credential) => credential.metadata.name === ansibleSelection)
            listAnsibleTowerJobs(selectedCred?.stringData?.host!, selectedCred?.stringData?.token!)
                .promise.then((response) => {
                    if (response) {
                        let templateList: string[] = []
                        if (response?.results) templateList = response.results!.map((job) => job.name!)
                        setAnsibleTowerJobTemplateList(templateList)
                        setAnsibleTowerAuthError('')
                    }
                })
                .catch(() => {
                    setAnsibleTowerAuthError('credentials:validate.ansible.host')
                    setAnsibleTowerJobTemplateList([])
                })
        }
    }, [ansibleSelection, ansibleCredentials])

    function updateAnsibleJob(ansibleJob?: ClusterCuratorAnsibleJob, replaceJob?: ClusterCuratorAnsibleJob) {
        if (ansibleJob && replaceJob && ansibleJob.name && editAnsibleJobList) {
            if (editAnsibleJobList.jobs.includes(replaceJob)) {
                editAnsibleJobList.setJobs(
                    editAnsibleJobList.jobs.map((job) => (job === replaceJob ? ansibleJob : job))
                )
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
                resourceVersion: resourceVersion,
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
            },
        }
        return curator
    }

    function cellsFn(ansibleJob: ClusterCuratorAnsibleJob) {
        return [
            <Flex style={{ gap: '8px' }}>
                <FlexItem>{ansibleJob.name}</FlexItem>
                {ansibleJob.extra_vars && (
                    <ChipGroup>
                        {Object.keys(ansibleJob.extra_vars).map((key) => (
                            <Chip isReadOnly>
                                {key}={ansibleJob.extra_vars![key]}
                            </Chip>
                        ))}
                    </ChipGroup>
                )}
            </Flex>,
        ]
    }

    const formData: FormData = {
        title: isEditing ? t('Edit Ansible template') : t('Create Ansible template'),
        titleTooltip: isEditing
            ? t(
                  "Edit a job template to alter the order of Ansible jobs that run at different stages of a cluster's life cycle"
              )
            : t(
                  "Create a job template to automatically run Ansible jobs at different stages of a cluster's life cycle"
              ),
        breadcrumb: [
            { text: t('Automation'), to: NavigationPath.ansibleAutomations },
            { text: isEditing ? t('Edit Ansible template') : t('Create Ansible template') },
        ],
        reviewDescription: t(
            'Review your choices for default job templates. Go back to a step if you have any changes to make.'
        ),
        reviewTitle: t('Review your default job templates'),
        cancelLabel: t('Cancel'),
        nextLabel: t('Next'),
        backLabel: t('Back'),
        sections: [
            {
                type: 'Section',
                title: t('Basic information'),
                wizardTitle: t('Configure Ansible job template name and Ansible credential'),
                description: t(
                    'The default job templates that you select appear automatically during cluster creation. To create a sequence of events, select multiple jobs. Drag and drop the job templates to reorder the sequence.'
                ),
                inputs: [
                    {
                        id: 'Template',
                        type: 'Text',
                        label: t('Template name'),
                        placeholder: t('Enter the name for the template'),
                        value: templateName,
                        onChange: setTemplateName,
                        isRequired: true,
                        isDisabled: isEditing,
                        validation: (value) => validateKubernetesDnsName(value, t),
                    },
                    {
                        id: 'ansibleSecrets',
                        type: 'Select',
                        label: t('Ansible Automation Platform credential'),
                        placeholder: t('Select an existing Ansible credential'),
                        value: ansibleSelection,
                        onChange: setAnsibleSelection,
                        isRequired: true,
                        options: ansibleCredentials.map((credential) => ({
                            id: credential.metadata.name as string,
                            value: credential.metadata.name as string,
                        })),
                        isDisabled: isEditing,
                        prompt: {
                            text: t('Add credential'),
                            linkType: LinkType.internalNewTab,
                            callback: () => history.push(NavigationPath.addCredentials),
                        },
                        validation: () => {
                            if (AnsibleTowerAuthError) return t(AnsibleTowerAuthError)
                        },
                    },
                ],
            },
            {
                type: 'SectionGroup',
                title: t('Ansible job templates'),
                sections: [
                    {
                        type: 'Section',
                        title: t('Install'),
                        wizardTitle: t('Configure Ansible job templates to run for your cluster at install'),
                        inputs: [
                            {
                                id: 'installPreJob',
                                type: 'OrderedItems',
                                label: t('Pre-install Ansible job templates'),
                                placeholder: t('Add an Ansible job template'),
                                value: installPreJobs,
                                onChange: setInstallPreJobs,
                                keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                label: t('Post-install Ansible job templates'),
                                placeholder: t('Add an Ansible job template'),
                                value: installPostJobs,
                                onChange: setInstallPostJobs,
                                keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                        title: t('Upgrade'),
                        wizardTitle: t('Configure Ansible job templates to run for your cluster at upgrade'),
                        inputs: [
                            {
                                id: 'upgradePreJob',
                                type: 'OrderedItems',
                                label: t('Pre-upgrade Ansible job templates'),
                                placeholder: t('Add an Ansible job template'),
                                value: upgradePreJobs,
                                onChange: setUpgradePreJobs,
                                keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                label: t('Post-upgrade Ansible job templates'),
                                placeholder: t('Add an Ansible job template'),
                                value: upgradePostJobs,
                                onChange: setUpgradePostJobs,
                                keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                  title: t('Scale'),
                                  wizardTitle: t('Configure Ansible job templates to run for your cluster at scaling'),
                                  inputs: [
                                      {
                                          id: 'scalePreJob',
                                          type: 'OrderedItems',
                                          label: t('Pre-scale Ansible job templates'),
                                          placeholder: t('Add an Ansible job template'),
                                          value: scalePreJobs,
                                          onChange: setScalePreJobs,
                                          keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                          label: t('Post-scale Ansible job templates'),
                                          placeholder: t('Add an Ansible job template'),
                                          value: scalePostJobs,
                                          onChange: setScalePostJobs,
                                          keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                  title: t('Destroy'),
                                  wizardTitle: t('Configure Ansible job templates to run for your cluster at destroy'),
                                  inputs: [
                                      {
                                          id: 'destroyPreJob',
                                          type: 'OrderedItems',
                                          label: t('Pre-destroy Ansible job templates'),
                                          placeholder: t('Add an Ansible job template'),
                                          value: destroyPreJobs,
                                          onChange: setDestroyPreJobs,
                                          keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                                          label: t('Post-destroy Ansible job templates'),
                                          placeholder: t('Add an Ansible job template'),
                                          value: destroyPostJobs,
                                          onChange: setDestroyPostJobs,
                                          keyFn: (ansibleJob: ClusterCuratorAnsibleJob) => ansibleJob.name,
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
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 4000))
                    history.push(NavigationPath.ansibleAutomations)
                })
            } else {
                return createResource(stateToData() as IResource).promise.then(async () => {
                    if (process.env.NODE_ENV === 'development')
                        await new Promise((resolve) => setTimeout(resolve, 4000))
                    history.push(NavigationPath.ansibleAutomations)
                })
            }
        },
        submitText: isEditing ? t('Save') : t('Add'),
        submittingText: isEditing ? t('Saving') : t('Adding'),
        cancel: () => history.push(NavigationPath.ansibleAutomations),
        stateToData,
    }

    return (
        <Fragment>
            <AcmDataFormPage formData={formData} mode={isViewing ? 'details' : isEditing ? 'form' : 'wizard'} />
            <EditAnsibleJobModal
                ansibleJob={editAnsibleJob}
                ansibleSelection={ansibleSelection}
                setAnsibleJob={updateAnsibleJob}
                ansibleCredentials={ansibleCredentials}
                ansibleTowerTemplateList={AnsibleTowerJobTemplateList}
                ansibleJobList={editAnsibleJobList?.jobs}
            />
        </Fragment>
    )
}

function EditAnsibleJobModal(props: {
    ansibleSelection?: string
    ansibleCredentials: ProviderConnection[]
    ansibleTowerTemplateList: string[] | undefined
    ansibleJob?: ClusterCuratorAnsibleJob
    ansibleJobList?: ClusterCuratorAnsibleJob[]
    setAnsibleJob: (ansibleJob?: ClusterCuratorAnsibleJob, old?: ClusterCuratorAnsibleJob) => void
}) {
    const { t } = useTranslation()
    const [ansibleJob, setAnsibleJob] = useState<ClusterCuratorAnsibleJob | undefined>()
    useEffect(() => setAnsibleJob(props.ansibleJob), [props.ansibleJob])
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={props.ansibleJob?.name !== '' ? t('Edit Ansible job') : t('Add Ansible job')}
            isOpen={props.ansibleJob !== undefined}
            onClose={() => props.setAnsibleJob()}
        >
            <AcmForm>
                <AcmSelect
                    maxHeight="18em"
                    menuAppendTo="parent"
                    label={t('Ansible job template name')}
                    id="job-name"
                    value={ansibleJob?.name}
                    helperText={t(
                        'The Ansible job template name must match the name of the job on the Ansible Tower. If the names are not the same, the hook cannot run the job.'
                    )}
                    onChange={(name) => {
                        if (ansibleJob) {
                            const copy = { ...ansibleJob }
                            copy.name = name as string
                            setAnsibleJob(copy)
                        }
                    }}
                    variant={SelectVariant.typeahead}
                    placeholder={t('Enter or select Ansible job template name')}
                    validation={(name) => {
                        const selectedJobs = _.map(props.ansibleJobList, 'name')
                        if (name && selectedJobs.includes(name)) {
                            // no duplicate job names can be added
                            return t(
                                'The job name already exists in this hook. The job list cannot contain duplicates.'
                            )
                        }
                    }}
                    isRequired
                >
                    {props.ansibleTowerTemplateList
                        ? props.ansibleTowerTemplateList?.map((name) => (
                              <SelectOption key={name} value={name}>
                                  {name}
                              </SelectOption>
                          ))
                        : undefined}
                </AcmSelect>

                <AcmLabelsInput
                    id="job-settings"
                    label={t('Extra variables')}
                    value={ansibleJob?.extra_vars}
                    onChange={(labels) => {
                        if (ansibleJob) {
                            const copy = { ...ansibleJob }
                            copy.extra_vars = labels
                            setAnsibleJob(copy)
                        }
                    }}
                    buttonLabel=""
                    placeholder={t('Enter key=value pairs')}
                />
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
