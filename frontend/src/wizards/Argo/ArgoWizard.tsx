/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  Flex,
  FlexItem,
  TextContent,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  TextVariants,
  ModalVariant,
  Modal,
  Label,
  Title,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon, GitAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  useItem,
  useData,
  useEditMode,
  WizAsyncSelect,
  WizDetailsHidden,
  EditMode,
  WizHidden,
  WizItemSelector,
  Section,
  Select,
  Step,
  Tile,
  WizTiles,
  WizardCancel,
  WizardSubmit,
  WizCheckbox,
  WizTextInput,
  Sync,
  WizArrayInput,
  WizTextDetail,
} from '@patternfly-labs/react-form-wizard'
import { WizardPage } from '../WizardPage'
import { IResource } from '../common/resources/IResource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementApiVersion, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { validateAppSetName, validateWebURL } from '../../lib/validation'
import { Placement } from '../Placement/Placement'
import HelmIcon from './logos/HelmIcon.svg'
import { DOC_LINKS } from '../../lib/doc-util'
import { useTranslation } from '../../lib/acm-i18next'
import { useWizardStrings } from '../../lib/wizardStrings'
import { useSharedSelectors } from '../../shared-recoil'
import { CreateCredentialModal } from '../../components/CreateCredentialModal'
import { CreateArgoResources } from './CreateArgoResources'
import { ApplicationSetKind, GitOpsCluster } from '../../resources'
import { GitOpsOperatorAlert } from '../../components/GitOpsOperatorAlert'
import { SupportedOperator, useOperatorCheck } from '../../lib/operatorCheck'
import { get } from 'lodash'

interface Channel {
  metadata?: {
    name?: string
    namespace?: string
  }
  spec: {
    pathname: string
    type: string
    secretRef?: { name: string }
  }
}

type RepositoryProps = {
  path?: string
  repoURL: string
  targetRevision?: string
  chart?: string
}

interface ApplicationSet {
  metadata: {
    name?: string
    namespace?: string
  }
  spec: {
    generators?: {
      clusterDecisionResource?: {
        configMapRef?: string
        requeueAfterSeconds?: number
      }
    }[]
    template?: {
      metadata?: {
        name?: string
        namespace?: string
      }
      spec?: {
        destination?: {
          namespace: string
          server: string
        }
        project: string
        source?: RepositoryProps
        sources?: RepositoryProps[]
        syncPolicy?: any
      }
    }
  }
  transformed?: {
    clusterCount?: string
  }
}

export interface ArgoWizardProps {
  breadcrumb?: { text: string; to?: string }[]
  applicationSets?: ApplicationSet[]
  createClusterSetCallback?: () => void
  clusters: IResource[]
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  ansibleCredentials: string[]
  argoServers: { label: string; value: GitOpsCluster; description?: string }[]
  namespaces: string[]
  onSubmit: WizardSubmit
  onCancel: WizardCancel
  placements: IPlacement[]
  channels?: Channel[]
  timeZones: string[]
  getGitRevisions: (
    channelPath: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  getGitPaths: (
    channelPath: string,
    branch: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  resources?: IResource[]
  yamlEditor?: () => ReactNode
}

export function ArgoWizard(props: ArgoWizardProps) {
  function onlyUnique(value: any, index: any, self: string | any[]) {
    return self.indexOf(value) === index
  }
  const { resources } = props
  const applicationSet: any = resources?.find((resource) => resource.kind === ApplicationSetKind)
  const source = applicationSet?.spec.template.spec.source
  const sources = applicationSet?.spec.template.spec.sources

  const requeueTimes = useMemo(() => [30, 60, 120, 180, 300], [])
  const { t } = useTranslation()

  const sourceGitChannels = useMemo(
    () =>
      props.channels
        ?.filter((channel) => channel?.spec?.type === 'Git' || channel?.spec?.type === 'GitHub')
        .filter((channel) => !channel?.spec?.secretRef) // filter out private ones
        .map((channel) => channel?.spec?.pathname),
    [props.channels]
  )
  const [createdChannels, setCreatedChannels] = useState<string[]>([])
  const gitChannels = useMemo(() => {
    const gitArgoAppSetRepoURLs: string[] = []
    if (props.applicationSets) {
      props.applicationSets.forEach((appset) => {
        const source = get(appset, 'spec.template.spec.source')
        const sources = get(appset, 'spec.template.spec.sources')
        if (sources) {
          sources.forEach((source: { chart: any; repoURL: string }) => {
            if (!source.chart) {
              gitArgoAppSetRepoURLs.push(source.repoURL as string)
            }
          })
        } else if (!sources && source) {
          if (!source.chart) {
            gitArgoAppSetRepoURLs.push(source.repoURL as string)
          }
        }
      })
    }
    return [...(sourceGitChannels ?? []), ...createdChannels, ...(gitArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
  }, [createdChannels, props.applicationSets, sourceGitChannels])

  const sourceHelmChannels = useMemo(() => {
    if (props.channels)
      return props.channels
        .filter((channel) => channel?.spec?.type === 'HelmRepo')
        ?.filter((channel) => !channel?.spec?.secretRef) // filter out private ones
        .map((channel) => channel.spec.pathname)
    return undefined
  }, [props.channels])

  const helmChannels = useMemo(() => {
    const helmArgoAppSetRepoURLs: string[] = []
    if (props.applicationSets) {
      props.applicationSets.forEach((appset) => {
        const source = get(appset, 'spec.template.spec.source')
        const sources = get(appset, 'spec.template.spec.sources')

        if (sources) {
          sources.forEach((source: { chart: string; repoURL: string }) => {
            if (source.chart) {
              helmArgoAppSetRepoURLs.push(source.repoURL)
            }
          })
        } else if (!sources && source) {
          if (source.chart) {
            helmArgoAppSetRepoURLs.push(source.repoURL)
          }
        }
      })
    }
    return [...(sourceHelmChannels ?? []), ...createdChannels, ...(helmArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
  }, [createdChannels, props.applicationSets, sourceHelmChannels])

  const [filteredClusterSets, setFilteredClusterSets] = useState<IResource[]>([])
  const [gitRevisionsAsyncCallback, setGitRevisionsAsyncCallback] = useState<() => Promise<string[]>>()
  const [gitPathsAsyncCallback, setGitPathsAsyncCallback] = useState<() => Promise<string[]>>()
  const editMode = useEditMode()

  const { gitOpsOperatorSubscriptionsValue } = useSharedSelectors()
  const gitOpsOperator = useOperatorCheck(SupportedOperator.gitOps, gitOpsOperatorSubscriptionsValue)
  const showAlert = !gitOpsOperator.pending && !gitOpsOperator.installed
  const disableForm = gitOpsOperator.pending || !gitOpsOperator.installed

  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  const targetRevision = get(applicationSet, 'spec.template.spec.source.targetRevision')
  const repoURL = get(applicationSet, 'spec.template.spec.source.repoURL')

  useEffect(() => {
    if (sources) {
      sources.forEach((source: { repoURL: string }) => {
        // two will override one, need to fix it
        setGitRevisionsAsyncCallback(
          () => () =>
            getGitBranchList(
              { metadata: { name: '', namespace: '' }, spec: { pathname: source.repoURL, type: 'git' } },
              props.getGitRevisions
            )
        )
      })
    } else if (source && !sources) {
      const channel = gitChannels.find((channel: any) => channel === repoURL)
      if (channel) {
        setGitRevisionsAsyncCallback(
          () => () =>
            getGitBranchList(
              { metadata: { name: '', namespace: '' }, spec: { pathname: channel, type: 'git' } },
              props.getGitRevisions
            )
        )
        setGitPathsAsyncCallback(
          () => () =>
            getGitPathList(
              {
                metadata: {
                  name: '',
                  namespace: '',
                },
                spec: { pathname: channel, type: 'git' },
              },
              targetRevision,
              props.getGitPaths,
              source.repoURL
            )
        )
      }
    }
  }, [
    gitChannels,
    props.channels,
    props.getGitPaths,
    props.getGitRevisions,
    repoURL,
    resources,
    source,
    sources,
    targetRevision,
  ])

  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Argo application steps'),
    contentAriaLabel: t('Argo application content'),
  })

  function SourceSelector() {
    return (
      <Fragment>
        <WizTiles
          path="spec.template.spec.source"
          label={t('Repository type')}
          inputValueToPathValue={repositoryTypeToSource}
          pathValueToInputValue={sourceToRepositoryType}
          onValueChange={(_, item: ApplicationSet) => {
            if (item.spec.template?.spec) {
              item.spec.template.spec.syncPolicy = {
                automated: {
                  selfHeal: true,
                  prune: true,
                },
                syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
              }
            }
          }}
        >
          <Tile id="git" value="Git" label={t('Git')} icon={<GitAltIcon />} description={t('Use a Git repository')} />
          <Tile id="helm" value="Helm" label={t('Helm')} icon={<HelmIcon />} description={t('Use a Helm repository')} />
        </WizTiles>
        {/* Git repo */}
        <WizHidden hidden={(data) => data.spec.template.spec.source.path === undefined}>
          <Select
            path="spec.template.spec.source.repoURL"
            label={t('URL')}
            labelHelp={t('The URL path for the Git repository.')}
            placeholder={t('Enter or select a Git URL')}
            options={gitChannels}
            onValueChange={(value) => {
              const channel = props.channels?.find((channel) => channel.spec.pathname === value)
              setGitRevisionsAsyncCallback(
                () => () =>
                  getGitBranchList(
                    {
                      metadata: {
                        name: channel?.metadata?.name,
                        namespace: channel?.metadata?.namespace,
                      },
                      spec: { pathname: value as string, type: 'git' },
                    },
                    props.getGitRevisions
                  )
              )
            }}
            validation={validateWebURL}
            required
            isCreatable
            onCreate={(value: string) =>
              setCreatedChannels((channels) => {
                if (!channels.includes(value)) {
                  channels.push(value)
                }
                setGitRevisionsAsyncCallback(
                  () => () =>
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: value, type: 'git' },
                      },
                      props.getGitRevisions
                    )
                )
                return [...channels]
              })
            }
          />
          <WizHidden hidden={(data) => data.spec.template.spec.source.repoURL === ''}>
            <WizAsyncSelect
              path="spec.template.spec.source.targetRevision"
              label={t('Revision')}
              labelHelp={t('Refer to a single commit')}
              placeholder={t('Enter or select a tracking revision')}
              asyncCallback={gitRevisionsAsyncCallback}
              isCreatable
              onValueChange={(value, item) => {
                const channel = props.channels?.find(
                  (channel) => channel?.spec?.pathname === item.spec.template.spec.source.repoURL
                )
                const path = createdChannels.find((channel) => channel === item.spec.template.spec.source.repoURL)
                setGitPathsAsyncCallback(
                  () => () =>
                    getGitPathList(
                      {
                        metadata: {
                          name: channel?.metadata?.name || '',
                          namespace: channel?.metadata?.namespace || '',
                        },
                        spec: {
                          pathname: channel?.spec.pathname || path || '',
                          type: 'git',
                        },
                      },
                      value as string,
                      props.getGitPaths,
                      item.spec.template.spec.source.repoURL
                    )
                )
              }}
            />
            <WizAsyncSelect
              path="spec.template.spec.source.path"
              label={t('Path')}
              labelHelp={t('The location of the resources on the Git repository.')}
              placeholder={t('Enter or select a repository path')}
              isCreatable
              asyncCallback={gitPathsAsyncCallback}
            />
          </WizHidden>
        </WizHidden>
        {/* Helm repo */}
        <WizHidden hidden={(data) => data.spec.template.spec.source.chart === undefined}>
          <Select
            path="spec.template.spec.source.repoURL"
            label={t('URL')}
            labelHelp={t('The URL path for the Helm repository.')}
            placeholder={t('Enter or select a Helm URL')}
            options={helmChannels}
            required
            isCreatable
            validation={validateWebURL}
            onCreate={(value: string) =>
              setCreatedChannels((channels) => {
                if (!channels.includes(value)) {
                  channels.push(value)
                }
                setGitRevisionsAsyncCallback(
                  () => () =>
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: value, type: 'git' },
                      },
                      props.getGitRevisions
                    )
                )
                return [...channels]
              })
            }
          />
          <WizTextInput
            path="spec.template.spec.source.chart"
            label={t('Chart name')}
            placeholder={t('Enter the name of the Helm chart')}
            labelHelp={t('The specific name for the target Helm chart.')}
            required
          />
          <WizTextInput
            path="spec.template.spec.source.targetRevision"
            label={t('Package version')}
            placeholder={t('Enter the version or versions')}
            labelHelp={t(
              'The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0.'
            )}
            required
          />
        </WizHidden>
      </Fragment>
    )
  }

  function SourcesSelector() {
    const editMode = useEditMode()
    return (
      <WizArrayInput
        path="spec.template.spec.sources"
        placeholder="Add repository"
        disallowEmpty={editMode === EditMode.Create}
        collapsedContent={
          <Fragment>
            <WizHidden hidden={(data) => !data.repositoryType}>
              <Title headingLevel="h6">{t('Repository type')}</Title>
            </WizHidden>

            <WizHidden hidden={(data) => data.repositoryType !== 'git'}>
              <Label style={{ marginRight: 10 }} color="grey">
                {t('Git')}
              </Label>
            </WizHidden>
            <WizHidden hidden={(data) => data.repositoryType !== 'helm'}>
              <Label style={{ marginRight: 10 }} color="grey">
                {t('Helm')}
              </Label>
            </WizHidden>
            <WizTextDetail path="repoURL" placeholder="Expand to enter the repository details" />
          </Fragment>
        }
      >
        <WizHidden hidden={(data) => data.repositoryType}>
          <Title headingLevel="h6">{t('Repository type')}</Title>
        </WizHidden>
        <WizTiles path="repositoryType">
          <Tile id="git" value="git" label="Git" icon={<GitAltIcon />} description="Use a Git repository" />
          <Tile id="helm" value="helm" label="Helm" icon={<HelmIcon />} description="Use a Helm repository" />
        </WizTiles>
        <WizHidden
          hidden={
            editMode === EditMode.Create ? (data) => data.repositoryType !== 'git' : (data) => data.path === undefined
          }
        >
          {/* git repository */}
          <Select
            path="repoURL"
            label={t('URL')}
            labelHelp={t('The URL path for the Git repository.')}
            placeholder={t('Enter or select a Git URL')}
            options={gitChannels}
            onValueChange={(value) => {
              const channel = props.channels?.find((channel) => channel.spec.pathname === value)
              setGitRevisionsAsyncCallback(
                () => () =>
                  getGitBranchList(
                    {
                      metadata: {
                        name: channel?.metadata?.name,
                        namespace: channel?.metadata?.namespace,
                      },
                      spec: { pathname: value as string, type: 'git' },
                    },
                    props.getGitRevisions
                  )
              )
            }}
            validation={validateWebURL}
            required
            isCreatable
            onCreate={(value: string) =>
              setCreatedChannels((channels) => {
                if (!channels.includes(value)) {
                  channels.push(value)
                }
                setGitRevisionsAsyncCallback(
                  () => () =>
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: value, type: 'git' },
                      },
                      props.getGitRevisions
                    )
                )
                return [...channels]
              })
            }
          />
          <WizAsyncSelect
            path="targetRevision"
            label={t('Revision')}
            labelHelp={t('Refer to a single commit')}
            placeholder={t('Enter or select a tracking revision')}
            asyncCallback={gitRevisionsAsyncCallback}
            isCreatable
            onValueChange={(value, item) => {
              const channel = props.channels?.find((channel) => channel?.spec?.pathname === item.repoURL)
              const path = createdChannels.find((channel) => channel === item.repoURL)
              setGitPathsAsyncCallback(
                () => () =>
                  getGitPathList(
                    {
                      metadata: {
                        name: channel?.metadata?.name || '',
                        namespace: channel?.metadata?.namespace || '',
                      },
                      spec: {
                        pathname: channel?.spec.pathname || path || '',
                        type: 'git',
                      },
                    },
                    value as string,
                    props.getGitPaths,
                    item.repoURL
                  )
              )
            }}
          />
          <WizAsyncSelect
            path="path"
            label={t('Path')}
            labelHelp={t('The location of the resources on the Git repository.')}
            placeholder={t('Enter or select a repository path')}
            isCreatable
            asyncCallback={gitPathsAsyncCallback}
          />
        </WizHidden>

        {/* helm repository */}
        <WizHidden
          hidden={
            editMode === EditMode.Create ? (data) => data.repositoryType !== 'helm' : (data) => data.chart === undefined
          }
        >
          <Select
            path="repoURL"
            label={t('URL')}
            labelHelp={t('The URL path for the Helm repository.')}
            placeholder={t('Enter or select a Helm URL')}
            options={helmChannels}
            required
            isCreatable
            validation={validateWebURL}
            onCreate={(value: string) =>
              setCreatedChannels((channels) => {
                if (!channels.includes(value)) {
                  channels.push(value)
                }
                setGitRevisionsAsyncCallback(
                  () => () =>
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: value, type: 'git' },
                      },
                      props.getGitRevisions
                    )
                )
                return [...channels]
              })
            }
          />
          <WizTextInput
            path="chart"
            label={t('Chart name')}
            placeholder={t('Enter the name of the Helm chart')}
            labelHelp={t('The specific name for the target Helm chart.')}
            required
          />
          <WizTextInput
            path="targetRevision"
            label={t('Package version')}
            placeholder={t('Enter the version or versions')}
            labelHelp={t(
              'The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0.'
            )}
            required
          />
        </WizHidden>
      </WizArrayInput>
    )
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
        <CreateArgoResources handleModalToggle={handleModalToggle} clusterSets={props.clusterSets} />
      </Modal>
      <WizardPage
        id="application-set-wizard"
        wizardStrings={translatedWizardStrings}
        breadcrumb={props.breadcrumb}
        title={props.resources ? t('Edit application set') : t('Create application set')}
        yamlEditor={props.yamlEditor}
        defaultData={
          props.resources ?? [
            {
              apiVersion: 'argoproj.io/v1alpha1',
              kind: 'ApplicationSet',
              metadata: { name: '', namespace: '' },
              spec: {
                generators: [
                  {
                    clusterDecisionResource: {
                      configMapRef: 'acm-placement',
                      labelSelector: {
                        matchLabels: {
                          'cluster.open-cluster-management.io/placement': '-placement',
                        },
                      },
                      requeueAfterSeconds: 180,
                    },
                  },
                ],
                template: {
                  metadata: {
                    name: '-{{name}}',
                    labels: {
                      'velero.io/exclude-from-backup': 'true',
                    },
                  },
                  spec: {
                    project: 'default',
                    sources: [],
                    destination: { namespace: '', server: '{{server}}' },
                    syncPolicy: {
                      automated: {
                        selfHeal: true,
                        prune: true,
                      },
                      syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
                    },
                  },
                },
              },
            },
            {
              ...PlacementType,
              metadata: { name: '', namespace: '' },
              spec: {},
            },
          ]
        }
        editMode={props.resources ? EditMode.Edit : EditMode.Create}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
      >
        <Step id="general" label={t('General')}>
          <Sync
            kind={PlacementKind}
            path="metadata.name"
            targetKind="ApplicationSet"
            targetPath="spec.generators.0.clusterDecisionResource.labelSelector.matchLabels.cluster\.open-cluster-management\.io/placement"
          />
          {editMode === EditMode.Create && (
            <Fragment>
              <Sync kind="ApplicationSet" path="metadata.name" suffix="-placement" />
            </Fragment>
          )}
          <Sync kind="ApplicationSet" path="metadata.namespace" />
          <Sync
            kind="ApplicationSet"
            path="metadata.name"
            targetKind="ApplicationSet"
            targetPath="spec.template.metadata.name"
            suffix="-{{name}}"
          />
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <GitOpsOperatorAlert showAlert={showAlert} />
            <Section label={t('General')}>
              <WizTextInput
                path="metadata.name"
                label={t('Name')}
                placeholder={t('Enter the application set name')}
                required
                id="name"
                validation={validateAppSetName}
                disabled={disableForm}
              />
              <Select
                id="namespace"
                path="metadata.namespace"
                label={t('Argo server')}
                placeholder={t('Select the Argo server')}
                disabled={disableForm}
                labelHelp={
                  <Fragment>
                    <Text>{t('Register a set of one or more managed clusters to Red Hat OpenShift GitOps.')}</Text>
                    <TextContent>
                      <Text
                        component={TextVariants.a}
                        isVisitedLink
                        href={DOC_LINKS.GITOPS_CONFIG}
                        target="_blank"
                        style={{
                          cursor: 'pointer',
                          display: 'inline-block',
                          padding: '0px',
                          fontSize: '14px',
                          color: '#0066cc',
                        }}
                      >
                        {t('View documentation')} <ExternalLinkAltIcon />
                      </Text>
                    </TextContent>
                  </Fragment>
                }
                options={props.argoServers}
                required
                footer={
                  <CreateCredentialModal buttonText={t('Add Argo Server')} handleModalToggle={handleModalToggle} />
                }
                onValueChange={(value: any, item: ApplicationSet) => {
                  const placementRefName = value.spec?.placementRef?.name
                  const placement = props.placements.find(
                    (placement) =>
                      placement.metadata?.namespace === value.metadata.namespace &&
                      placement.metadata?.name === placementRefName
                  )

                  // set filtered cluster set
                  const clusterSets: IResource[] = props.clusterSets.filter((clusterSet) => {
                    return placement?.spec?.clusterSets!.includes(clusterSet.metadata?.name!)
                  })

                  setFilteredClusterSets(clusterSets)

                  // set namespace
                  if (value) {
                    item.metadata.namespace = value.metadata.namespace
                  }
                }}
              />
              <Select
                path="spec.generators.0.clusterDecisionResource.requeueAfterSeconds"
                label={t('Requeue time')}
                options={requeueTimes}
                labelHelp={t('Cluster decision resource requeue time in seconds')}
                required
                disabled={disableForm}
              />
            </Section>
          </WizItemSelector>
        </Step>
        <Step id="template" label={t('Template')}>
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <Section label={t('Source')}>{source && !sources ? <SourceSelector /> : <SourcesSelector />}</Section>
            <Section label={t('Destination')}>
              <WizTextInput
                id="destination"
                path="spec.template.spec.destination.namespace"
                label={t('Remote namespace')}
                placeholder={t('Enter the destination namespace')}
                required
              />
            </Section>
          </WizItemSelector>
        </Step>
        <Step id="sync-policy" label={t('Sync policy')}>
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <Section
              label={t('Sync policy')}
              description={t(
                'Settings used to configure application syncing when there are differences between the desired state and the live cluster state.'
              )}
            >
              <WizCheckbox
                label={t('Delete resources that are no longer defined in the source repository')}
                path="spec.template.spec.syncPolicy.automated.prune"
              />
              <WizCheckbox
                id="prune-last"
                label={t(
                  'Delete resources that are no longer defined in the source repository at the end of a sync operation'
                )}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={booleanToSyncOptions('PruneLast')}
                pathValueToInputValue={syncOptionsToBoolean('PruneLast')}
              />
              <WizCheckbox
                id="replace"
                label={t('Replace resources instead of applying changes from the source repository')}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={booleanToSyncOptions('Replace')}
                pathValueToInputValue={syncOptionsToBoolean('Replace')}
              />

              <WizCheckbox
                path="spec.template.spec.syncPolicy.automated.allowEmpty"
                label={t('Allow applications to have empty resources')}
              />
              <WizCheckbox
                id="apply-out-of-sync-only"
                label={t('Only synchronize out-of-sync resources')}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={booleanToSyncOptions('ApplyOutOfSyncOnly')}
                pathValueToInputValue={syncOptionsToBoolean('ApplyOutOfSyncOnly')}
              />
              <WizCheckbox
                path="spec.template.spec.syncPolicy.automated.selfHeal"
                label={t('Automatically sync when cluster state changes')}
              />
              <WizCheckbox
                id="create-namespace"
                label={t('Automatically create namespace if it does not exist')}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={booleanToSyncOptions('CreateNamespace')}
                pathValueToInputValue={syncOptionsToBoolean('CreateNamespace')}
              />
              <WizCheckbox
                id="validate"
                label={t('Disable kubectl validation')}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={booleanToSyncOptions('Validate')}
                pathValueToInputValue={syncOptionsToBoolean('Validate')}
              />
              <WizCheckbox
                id="propagation-policy"
                label={t('Prune propagation policy')}
                path="spec.template.spec.syncPolicy.syncOptions"
                inputValueToPathValue={checkboxPrunePropagationPolicyToSyncOptions}
                pathValueToInputValue={checkboxSyncOptionsToPrunePropagationPolicy}
              >
                <Select
                  label={t('Propagation policy')}
                  options={[
                    { label: t('foreground'), value: 'foreground' },
                    { label: t('background'), value: 'background' },
                    { label: t('orphan'), value: 'orphan' },
                  ]}
                  path="spec.template.spec.syncPolicy.syncOptions"
                  inputValueToPathValue={prunePropagationPolicyToSyncOptions}
                  pathValueToInputValue={syncOptionsToPrunePropagationPolicy}
                  required
                />
              </WizCheckbox>
            </Section>
          </WizItemSelector>
        </Step>
        <Step id="placement" label={t('Placement')}>
          <ArgoWizardPlacementSection
            placements={props.placements}
            clusters={props.clusters}
            clusterSets={filteredClusterSets}
            clusterSetBindings={props.clusterSetBindings}
            createClusterSetCallback={props.createClusterSetCallback}
          />
        </Step>
      </WizardPage>
    </Fragment>
  )
}

async function getGitBranchList(
  channel: Channel,
  getGitBranches: (
    channelPath: string,
    secretArgs?: { secretRef?: string; namespace?: string } | undefined
  ) => Promise<unknown>
) {
  return getGitBranches(channel.spec.pathname, {
    secretRef: channel.spec?.secretRef?.name,
    namespace: channel.metadata?.namespace,
  }) as Promise<string[]>
}

async function getGitPathList(
  channel: Channel,
  branch: string,
  getGitPaths: (
    channelPath: string,
    branch: string,
    secretArgs?: { secretRef?: string; namespace?: string }
  ) => Promise<unknown>,
  url?: string
): Promise<string[]> {
  return getGitPaths(channel?.spec?.pathname || (url as string), branch, {
    secretRef: channel?.spec?.secretRef?.name,
    namespace: channel.metadata?.namespace,
  }) as Promise<string[]>
}

export function ExternalLinkButton(props: { id: string; href?: string; icon?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Flex>
      <FlexItem spacer={{ default: 'spacerXl' }}>
        <Button
          id={props.id}
          icon={props.icon}
          isSmall={true}
          variant="link"
          component="a"
          href={props.href}
          target="_blank"
        >
          {t('Add cluster sets')}
        </Button>
      </FlexItem>
    </Flex>
  )
}

function repositoryTypeToSource(value: unknown) {
  if (value === 'Git') {
    return {
      repoURL: '',
      targetRevision: '',
      path: '',
    }
  }
  if (value === 'Helm') {
    return {
      repoURL: '',
      chart: '',
      targetRevision: '',
    }
  }
  return value
}

function sourceToRepositoryType(source: unknown) {
  if (typeof source === 'object' && source !== null) {
    const isGit = 'repoURL' in source && 'path' in source && 'targetRevision' in source
    if (isGit) return 'Git'

    const isHelm = 'repoURL' in source && 'chart' in source && 'targetRevision' in source
    if (isHelm) return 'Helm'
  }

  return undefined
}

function booleanToSyncOptions(key: string) {
  return (value: unknown, array: unknown) => {
    let newArray: unknown[]
    if (Array.isArray(array)) {
      newArray = array
    } else {
      newArray = []
    }
    const index = newArray.findIndex((entry) => typeof entry === 'string' && entry.startsWith(`${key}=`))
    if (typeof value === 'boolean') {
      if (index !== -1) {
        newArray[index] = `${key}=${value.toString()}`
      } else {
        newArray.push(`${key}=${value.toString()}`)
      }
    }
    return newArray
  }
}

function syncOptionsToBoolean(key: string) {
  return (array: unknown) => {
    if (Array.isArray(array)) return array?.includes(`${key}=true`)
    return false
  }
}

function checkboxPrunePropagationPolicyToSyncOptions(value: unknown, array: unknown) {
  let newArray: unknown[]
  if (Array.isArray(array)) {
    newArray = array
  } else {
    newArray = []
  }
  if (typeof value === 'boolean') {
    const index = newArray.findIndex(
      (entry) => typeof entry === 'string' && entry.startsWith(`PrunePropagationPolicy=`)
    )
    if (value === true) {
      if (index === -1) {
        newArray.push(`PrunePropagationPolicy=background`)
      }
    } else {
      if (index !== -1) {
        newArray.splice(index, 1)
      }
    }
  }
  return newArray
}

function checkboxSyncOptionsToPrunePropagationPolicy(array: unknown) {
  return (
    Array.isArray(array) &&
    array.find((entry) => typeof entry === 'string' && entry.startsWith(`PrunePropagationPolicy=`)) !== undefined
  )
}

function prunePropagationPolicyToSyncOptions(value: unknown, array: unknown) {
  let newArray: unknown[]
  if (Array.isArray(array)) {
    newArray = array
  } else {
    newArray = []
  }
  const index = newArray.findIndex((entry) => typeof entry === 'string' && entry.startsWith(`PrunePropagationPolicy=`))
  if (typeof value === 'string') {
    if (index !== -1) {
      newArray[index] = `PrunePropagationPolicy=${value}`
    } else {
      newArray.push(`PrunePropagationPolicy=${value}`)
    }
  }
  return newArray
}

function syncOptionsToPrunePropagationPolicy(array: unknown) {
  if (Array.isArray(array)) {
    const index = array.findIndex((entry) => typeof entry === 'string' && entry.startsWith(`PrunePropagationPolicy=`))
    if (index !== -1) {
      const value = array[index]
      if (typeof value === 'string') {
        return value.slice('PrunePropagationPolicy='.length)
      }
    }
  }

  return 'background'
}

function ArgoWizardPlacementSection(props: {
  placements: IPlacement[]
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
  createClusterSetCallback?: () => void
}) {
  const { t } = useTranslation()
  const resources = useItem() as IResource[]
  const editMode = useEditMode()
  const hasPlacement = resources.find((r) => r.kind === PlacementKind) !== undefined
  const applicationSet = resources.find((r) => r.kind === 'ApplicationSet')
  const placements = props.placements.filter(
    (placement) => placement.metadata?.namespace === applicationSet?.metadata?.namespace
  )
  const namespaceClusterSetNames =
    props.clusterSetBindings
      ?.filter((clusterSetBinding) => clusterSetBinding.metadata?.namespace === applicationSet?.metadata?.namespace)
      .filter((clusterSetBinding) =>
        props.clusterSets?.find((clusterSet) => clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet)
      )
      .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []

  const { update } = useData()
  return (
    <Section label={t('Placement')}>
      {(editMode === EditMode.Create || !hasPlacement) && (
        <WizDetailsHidden>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {editMode === EditMode.Create && (
              <span className="pf-c-form__label pf-c-form__label-text">{t('How do you want to select clusters?')}</span>
            )}
            <ToggleGroup>
              <ToggleGroupItem
                text={t('New placement')}
                isSelected={hasPlacement}
                onClick={() => {
                  const newResources = resources.filter((resource) => resource.kind !== PlacementKind)
                  newResources.push({
                    apiVersion: PlacementApiVersion,
                    kind: PlacementKind,
                    metadata: { name: '', namespace: '' },
                    spec: {},
                  } as IResource)
                  update(newResources)
                }}
              />
              <ToggleGroupItem
                text={t('Existing placement')}
                isSelected={!hasPlacement}
                onClick={() => {
                  const newResources = resources.filter((resource) => resource.kind !== PlacementKind)
                  update(newResources)
                }}
              />
            </ToggleGroup>
          </div>
        </WizDetailsHidden>
      )}
      {hasPlacement ? (
        <WizItemSelector selectKey="kind" selectValue={PlacementKind}>
          <Placement
            namespaceClusterSetNames={namespaceClusterSetNames}
            clusters={props.clusters}
            hideName
            createClusterSetCallback={props.createClusterSetCallback}
            alertTitle={t('ClusterSets failed to load. Check the GitOpsCluster and Placement YAML for status errors.')}
          />
        </WizItemSelector>
      ) : (
        <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
          <Select
            path="spec.generators.0.clusterDecisionResource.labelSelector.matchLabels.cluster\.open-cluster-management\.io/placement"
            label={t('Existing placement')}
            placeholder={t('Select the existing placement')}
            options={placements.map((placement) => placement.metadata?.name ?? '')}
          />
        </WizItemSelector>
      )}
    </Section>
  )
}
