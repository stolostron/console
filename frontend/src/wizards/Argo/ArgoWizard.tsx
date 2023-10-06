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
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  useItem,
  useData,
  useEditMode,
  WizDetailsHidden,
  EditMode,
  WizItemSelector,
  Section,
  Select,
  Step,
  WizardCancel,
  WizardSubmit,
  WizCheckbox,
  WizTextInput,
  Sync,
} from '@patternfly-labs/react-form-wizard'
import { WizardPage } from '../WizardPage'
import { IResource } from '../common/resources/IResource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementApiVersion, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { validateAppSetName } from '../../lib/validation'
import { Placement } from '../Placement/Placement'
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
import { SourceSelector } from './SourceSelector'
import { MultipleSourcesSelector } from './MultipleSourcesSelector'
import { NavigationPath } from '../../NavigationPath'

export interface Channel {
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

function onlyUnique(value: any, index: any, self: string | any[]) {
  return self.indexOf(value) === index
}

export function ArgoWizard(props: ArgoWizardProps) {
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
    props.applicationSets?.forEach((appset) => {
      const source = get(appset, 'spec.template.spec.source')
      const sources = get(appset, 'spec.template.spec.sources')
      if (sources) {
        sources.forEach((source: { chart: any; repoURL: string }) => {
          if (!source.chart) {
            gitArgoAppSetRepoURLs.push(source.repoURL)
          }
        })
      } else if (!sources && source) {
        if (!source.chart) {
          gitArgoAppSetRepoURLs.push(source.repoURL)
        }
      }
    })

    return [...(sourceGitChannels ?? []), ...createdChannels, ...(gitArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
  }, [createdChannels, props.applicationSets, sourceGitChannels])

  const sourceHelmChannels = useMemo(() => {
    if (props.channels)
      return props.channels
        .filter((channel) => channel?.spec?.type === 'HelmRepo')
        ?.filter((channel) => !channel?.spec?.secretRef) // filter out private ones
        .map((channel) => channel.spec.pathname)
    return []
  }, [props.channels])

  const helmChannels = useMemo(() => {
    const helmArgoAppSetRepoURLs: string[] = []
    props.applicationSets?.forEach((appset) => {
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

    return [...sourceHelmChannels, ...createdChannels, ...(helmArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
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
    if (source && !sources) {
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

  const defaultData = props.resources ?? [
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
        defaultData={defaultData}
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
                    if (placement?.spec?.clusterSets) {
                      if (placement?.spec?.clusterSets.length > 0) {
                        return placement?.spec?.clusterSets.includes(clusterSet.metadata?.name!)
                      } else {
                        return clusterSet
                      }
                    }
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
            <Section label={t('Repository')}>
              {source && !sources ? (
                <SourceSelector
                  createdChannels={createdChannels}
                  setCreatedChannels={setCreatedChannels}
                  t={t}
                  getGitPaths={props.getGitPaths}
                  gitChannels={gitChannels}
                  channels={props.channels}
                  helmChannels={helmChannels}
                  gitPathsAsyncCallback={gitPathsAsyncCallback}
                  gitRevisionsAsyncCallback={gitRevisionsAsyncCallback}
                  setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
                  setGitPathsAsyncCallback={setGitPathsAsyncCallback}
                  getGitRevisions={props.getGitRevisions}
                />
              ) : (
                <MultipleSourcesSelector
                  channels={props.channels}
                  createdChannels={createdChannels}
                  getGitPaths={props.getGitPaths}
                  getGitRevisions={props.getGitRevisions}
                  gitChannels={gitChannels}
                  gitRevisionsAsyncCallback={gitRevisionsAsyncCallback}
                  gitPathsAsyncCallback={gitPathsAsyncCallback}
                  helmChannels={helmChannels}
                  setCreatedChannels={setCreatedChannels}
                  setGitPathsAsyncCallback={setGitPathsAsyncCallback}
                  setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
                  t={t}
                />
              )}
            </Section>
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

export async function getGitBranchList(
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

export async function getGitPathList(
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
            alertTitle={t(
              'ClusterSets failed to load. Check the ManagedClusterSetBinding resource to verify your selected namespace. In addition, check GitOpsCluster and Placement resources for status errors.'
            )}
            alertContent={
              <Button variant="link" onClick={() => window.open(NavigationPath.clusterSets)} style={{ padding: '0' }}>
                {t('Add cluster set')}
              </Button>
            }
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
