/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  ItemContext,
  Section,
  Step,
  Sync,
  useData,
  useEditMode,
  useItem,
  WizardCancel,
  WizardSubmit,
  WizCheckbox,
  WizDetailsHidden,
  WizItemSelector,
  WizSelect,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import { Button, Content, ContentVariants, Flex, FlexItem, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { get, set } from 'lodash'
import { Fragment, ReactNode, useContext, useMemo, useRef, useState } from 'react'
import { CreateCredentialModal } from '../../components/CreateCredentialModal'
import { GitOpsOperatorAlert } from '../../components/GitOpsOperatorAlert'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { SupportedOperator, useOperatorCheck } from '../../lib/operatorCheck'
import { validateAppSetName } from '../../lib/validation'
import { useWizardStrings } from '../../lib/wizardStrings'
import { NavigationPath } from '../../NavigationPath'
import { ApplicationSetKind, GitOpsCluster } from '../../resources'
import { useSharedSelectors } from '../../shared-recoil'
import { AcmAlert } from '../../ui-components'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementApiVersion, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { IResource } from '../common/resources/IResource'
import { Placement } from '../Placement/Placement'
import { WizardPage } from '../WizardPage'
import { ClusterSetMonitor } from './ClusterSetMonitor'
import { CreateArgoResources } from './CreateArgoResources'
import { MultipleSourcesSelector } from './MultipleSourcesSelector'
import { SourceSelector } from './SourceSelector'
import { MultipleGeneratorSelector, SyncGenerator } from './MultipleGeneratorSelector'
import { safeGet } from '../../routes/Applications/ApplicationDetails/ApplicationTopology/utils'
import { findObjectWithKey } from '../../routes/Applications/ApplicationDetails/ApplicationTopology/model/application'

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
  isPullModel?: boolean
}

function onlyUnique(value: any, index: any, self: string | any[]) {
  return self.indexOf(value) === index
}

export function ArgoWizard(props: ArgoWizardProps) {
  const { resources, isPullModel = false } = props
  const applicationSet: any = resources?.find((resource) => resource.kind === ApplicationSetKind)
  const source = applicationSet?.spec.template.spec.source
  const sources = applicationSet?.spec.template.spec.sources

  const { t } = useTranslation()

  const hubCluster = useMemo(
    () => props.clusters.find((cls) => cls.metadata?.labels && cls.metadata.labels['local-cluster'] === 'true'),
    [props.clusters]
  )
  const sourceGitChannels = useMemo(
    () =>
      props.channels
        ?.filter((channel) => channel?.spec?.type === 'Git' || channel?.spec?.type === 'GitHub')
        .filter((channel) => !channel?.spec?.secretRef) // filter out private ones
        .map((channel) => channel?.spec?.pathname),
    [props.channels]
  )
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

    return [...(sourceGitChannels ?? []), ...(gitArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
  }, [props.applicationSets, sourceGitChannels])

  const gitGeneratorRepos = useMemo(() => {
    const urls: string[] = []
    const versions: string[] = []
    const paths: string[] = []

    props.applicationSets?.forEach((appset) => {
      const generatorPath = findGeneratorPathWithGenType(appset, 'git')
      if (generatorPath) {
        const url = get(appset, `${generatorPath}.repoURL`)
        if (url) urls.push(url)

        const version = get(appset, `${generatorPath}.revision`)
        if (version) versions.push(version)

        const directories = get(appset, `${generatorPath}.directories`) as { path: string }[] | undefined
        if (Array.isArray(directories)) {
          directories.forEach((dir) => {
            if (dir.path) paths.push(dir.path)
          })
        }
      }
    })

    return { urls: urls.filter(onlyUnique), versions: versions.filter(onlyUnique), paths: paths.filter(onlyUnique) }
  }, [props.applicationSets])

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

    return [...sourceHelmChannels, ...(helmArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
  }, [props.applicationSets, sourceHelmChannels])

  const [filteredClusterSets, setFilteredClusterSets] = useState<IResource[]>([])
  const [generatorPath, setGeneratorPath] = useState<string>(() =>
    get(applicationSet, 'spec.generators.0.matrix') ? 'spec.generators.0.matrix.generators' : 'spec.generators'
  )
  const prevGenState = useRef<{ hasGitGen?: boolean; hasListGen?: boolean }>({})
  const editMode = useEditMode()

  const { gitOpsOperatorSubscriptionsValue } = useSharedSelectors()
  const gitOpsOperator = useOperatorCheck(SupportedOperator.gitOps, gitOpsOperatorSubscriptionsValue)
  const showAlert = !gitOpsOperator.pending && !gitOpsOperator.installed
  const disableForm = gitOpsOperator.pending || !gitOpsOperator.installed

  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Argo application steps'),
    contentAriaLabel: t('Argo application content'),
  })

  let defaultData

  if (resources && resources.length > 0) {
    defaultData = resources
  } else {
    defaultData = isPullModel
      ? [
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
                  annotations: {
                    'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
                    'apps.open-cluster-management.io/ocm-managed-cluster-app-namespace': 'openshift-gitops',
                    'argocd.argoproj.io/skip-reconcile': 'true',
                  },
                  name: '-{{name}}',
                  labels: {
                    'velero.io/exclude-from-backup': 'true',
                    'apps.open-cluster-management.io/pull-to-ocm-managed-cluster': 'true',
                  },
                },
                spec: {
                  project: 'default',
                  sources: [],
                  destination: { namespace: '', server: '{{server}}' },
                  syncPolicy: {
                    automated: {
                      enabled: true,
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
            spec: {
              tolerations: [
                {
                  key: 'cluster.open-cluster-management.io/unreachable',
                  operator: 'Exists',
                },
                {
                  key: 'cluster.open-cluster-management.io/unavailable',
                  operator: 'Exists',
                },
              ],
              numberOfClusters: 1,
              predicates: [
                {
                  // ArgoCD pull model doesn't support the hub cluster
                  requiredClusterSelector: {
                    labelSelector: {
                      matchExpressions: [
                        {
                          key: 'name',
                          operator: 'NotIn',
                          values: [hubCluster?.metadata?.name],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        ]
      : [
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
                      enabled: true,
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
            spec: {
              tolerations: [
                {
                  key: 'cluster.open-cluster-management.io/unreachable',
                  operator: 'Exists',
                },
                {
                  key: 'cluster.open-cluster-management.io/unavailable',
                  operator: 'Exists',
                },
              ],
              numberOfClusters: 1,
            },
          },
        ]
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
        title={
          resources
            ? isPullModel
              ? t('Edit application set - Pull model')
              : t('Edit application set - push model')
            : isPullModel
              ? t('Create application set - Pull model')
              : t('Create application set - push model')
        }
        yamlEditor={props.yamlEditor}
        defaultData={defaultData}
        editMode={resources ? EditMode.Edit : EditMode.Create}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
      >
        <Step id="general" label={t('General')}>
          <ClusterSetMonitor
            argoServers={props.argoServers}
            clusterSets={props.clusterSets}
            placements={props.placements}
            onFilteredClusterSetsChange={setFilteredClusterSets}
          />
          <SyncPlacementNameToApplicationSet />
          {editMode === EditMode.Create && (
            <Fragment>
              <Sync kind="ApplicationSet" path="metadata.name" suffix="-placement" />
            </Fragment>
          )}
          <Sync kind="ApplicationSet" path="metadata.namespace" />
          {/* the generator now syncs app name with template name */}
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <GitOpsOperatorAlert showAlert={showAlert} isPullModel={isPullModel} />
            {isPullModel && !resources && !showAlert && (
              <AcmAlert
                isInline
                noClose
                variant="info"
                title={t('Operator required')}
                message={t(
                  'The OpenShift GitOps Operator is required on the managed clusters to create an application set pull model type. Make sure the operator is installed on all managed clusters you are targeting.'
                )}
              />
            )}
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
              <WizSelect
                id="namespace"
                path="metadata.namespace"
                label={t('Argo server')}
                placeholder={t('Select the Argo server')}
                disabled={disableForm}
                labelHelp={
                  <Fragment>
                    <Content component="p">
                      {t('Register a set of one or more managed clusters to Red Hat OpenShift GitOps.')}
                    </Content>
                    <Content>
                      <Content
                        component={ContentVariants.a}
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
                      </Content>
                    </Content>
                  </Fragment>
                }
                options={props.argoServers}
                required
                footer={
                  <CreateCredentialModal buttonText={t('Add Argo Server')} handleModalToggle={handleModalToggle} />
                }
                onValueChange={(value: any, item: ApplicationSet) => {
                  // set namespace
                  if (value) {
                    item.metadata.namespace = value.metadata.namespace
                  }
                }}
              />
            </Section>
          </WizItemSelector>
        </Step>
        <Step id="generators" label={t('Generators')}>
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <Section
              label={t('Generators')}
              description={t(
                'Generators determine where applications are deployed by substituting parameter values in a template from which applications are created. Up to two complementary generators may be defined. One might be used to define the clusters and the other the application names.'
              )}
            >
              <MultipleGeneratorSelector
                resources={props.resources ?? []}
                gitChannels={gitChannels}
                channels={props.channels}
                helmChannels={helmChannels}
                gitGeneratorRepos={gitGeneratorRepos}
                disableForm={disableForm}
                generatorPath={generatorPath}
              />
              <SyncGenerator setGeneratorPath={setGeneratorPath} prevGenState={prevGenState} />
            </Section>
          </WizItemSelector>
        </Step>
        <Step id="repository" label={t('Repository')}>
          <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
            <Section label={t('Repository')} description={t('Repository of the applications to be created.')}>
              {source && !sources ? (
                <SourceSelector gitChannels={gitChannels} channels={props.channels} helmChannels={helmChannels} />
              ) : (
                <MultipleSourcesSelector
                  channels={props.channels}
                  gitChannels={gitChannels}
                  helmChannels={helmChannels}
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
            <ArgoSyncPolicySection />
            <ArgoAutomatedSyncPolicySection />
          </WizItemSelector>
        </Step>
        <Step id="placement" label={t('Placement')}>
          <ArgoWizardPlacementSection
            placements={props.placements}
            clusters={props.clusters}
            clusterSets={filteredClusterSets}
            clusterSetBindings={props.clusterSetBindings}
            createClusterSetCallback={props.createClusterSetCallback}
            isPullModel={isPullModel}
            hubClusterName={hubCluster?.metadata?.name ?? ''}
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
  if (!branch) {
    return Promise.resolve([])
  }
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
          size="sm"
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

function ArgoSyncPolicySection() {
  const { t } = useTranslation()

  return (
    <Section
      label={t('Sync policy')}
      description={t(
        'Settings used to configure application syncing when there are differences between the desired state and the live cluster state.'
      )}
    >
      <WizCheckbox
        id="prune-last"
        label={t('Delete resources that are no longer defined in the source repository at the end of a sync operation')}
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
        id="apply-out-of-sync-only"
        label={t('Only synchronize out-of-sync resources')}
        path="spec.template.spec.syncPolicy.syncOptions"
        inputValueToPathValue={booleanToSyncOptions('ApplyOutOfSyncOnly')}
        pathValueToInputValue={syncOptionsToBoolean('ApplyOutOfSyncOnly')}
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
        <WizSelect
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
  )
}

function ArgoAutomatedSyncPolicySection() {
  const { t } = useTranslation()
  const automatedField = useItem('spec.template.spec.syncPolicy.automated')
  // Retain support for the old automated field behavior
  // Set enabled to true if the old automated field is not null but no enabled field is present
  if (automatedField !== null && get(automatedField, 'enabled') === undefined) {
    set(automatedField, 'enabled', true)
  }
  const automated = useItem('spec.template.spec.syncPolicy.automated.enabled')

  return (
    <Section label={t('Automated sync options')} description={t('argo.automated.sync.description')}>
      <WizCheckbox path="spec.template.spec.syncPolicy.automated.enabled" label={t('Enable automated sync')} />
      <WizCheckbox
        label={t('Delete resources that are no longer defined in the source repository')}
        path="spec.template.spec.syncPolicy.automated.prune"
        disabled={automated === false}
        labelHelp={t('If automated sync is disabled, this option will be ignored.')}
      />
      <WizCheckbox
        path="spec.template.spec.syncPolicy.automated.allowEmpty"
        label={t('Allow applications to have empty resources')}
        disabled={automated === false}
        labelHelp={t('If automated sync is disabled, this option will be ignored.')}
      />
      <WizCheckbox
        path="spec.template.spec.syncPolicy.automated.selfHeal"
        label={t('Automatically sync when cluster state changes')}
        disabled={automated === false}
        labelHelp={t('If automated sync is disabled, this option will be ignored.')}
      />
    </Section>
  )
}

function ArgoWizardPlacementSection(props: {
  placements: IPlacement[]
  clusterSets: IResource[]
  clusterSetBindings: IClusterSetBinding[]
  clusters: IResource[]
  createClusterSetCallback?: () => void
  isPullModel?: boolean
  hubClusterName: string
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
        props.clusterSets?.find(
          (clusterSet) =>
            clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet &&
            clusterSetBinding.metadata?.namespace === applicationSet?.metadata?.namespace
        )
      )
      .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []
  const { update } = useData()
  const { isPullModel = false } = props
  return (
    <Section label={t('Placement')}>
      {(editMode === EditMode.Create || !hasPlacement) && (
        <WizDetailsHidden>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {editMode === EditMode.Create && (
              <span className="pf-v6-c-form__label pf-v6-c-form__label-text">
                {t('How do you want to select clusters?')}
              </span>
            )}
            <ToggleGroup>
              <ToggleGroupItem
                text={t('New placement')}
                isSelected={hasPlacement}
                onClick={() => {
                  const newResources = resources.filter((resource) => resource.kind !== PlacementKind)
                  newResources.push(
                    isPullModel
                      ? ({
                          apiVersion: PlacementApiVersion,
                          kind: PlacementKind,
                          metadata: { name: '', namespace: '' },
                          spec: {
                            predicates: [
                              {
                                // ArgoCD pull model doesn't support the hub cluster
                                requiredClusterSelector: {
                                  labelSelector: {
                                    matchExpressions: [
                                      {
                                        key: 'name',
                                        operator: 'NotIn',
                                        values: [props.hubClusterName],
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        } as IResource)
                      : ({
                          apiVersion: PlacementApiVersion,
                          kind: PlacementKind,
                          metadata: { name: '', namespace: '' },
                          spec: {},
                        } as IResource)
                  )
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
          <ExistingPlacementSelect placements={placements} />
        </WizItemSelector>
      )}
    </Section>
  )
}

function findGeneratorPathWithGenType(item: unknown, genType: string): string | undefined {
  // Generators can be at 'spec.generators' or 'spec.generators.0.matrix.generators' (matrix case)
  // When called from SyncPlacementNameToApplicationSet, item is an array; otherwise it's not
  const targetItem = Array.isArray(item) ? item[0] : item
  const generatorsPath = get(targetItem, 'spec.generators.0.matrix')
    ? 'spec.generators.0.matrix.generators'
    : 'spec.generators'

  const generators = safeGet(targetItem, generatorsPath, []) as unknown[]
  if (!Array.isArray(generators)) return undefined

  for (let i = 0; i < generators.length; i++) {
    const generator = generators[i]
    if (findObjectWithKey(generator, genType)) {
      return `${generatorsPath}.${i}.${genType}`
    }
  }
  return undefined
}

// fun fact, you can paste an argo app without a repositoryType key value because argo defaults to git
//  but the wizard needs a reositoryType in order to function
export function setRepositoryTypeForSources(resources: any[] | undefined): any[] | undefined {
  return resources?.map((resource: any) => {
    const sources = resource?.spec?.template?.spec?.sources
    if (Array.isArray(sources)) {
      const updatedSources = sources.map((source: any) =>
        source.repositoryType ? source : { ...source, repositoryType: 'git' }
      )
      return {
        ...resource,
        spec: {
          ...resource.spec,
          template: {
            ...resource.spec.template,
            spec: {
              ...resource.spec.template.spec,
              sources: updatedSources,
            },
          },
        },
      }
    }
    return resource
  })
}

function SyncPlacementNameToApplicationSet() {
  const item = useContext(ItemContext)
  const targetPath = `${findGeneratorPathWithGenType(item, 'clusterDecisionResource')}.labelSelector.matchLabels.cluster\\.open-cluster-management\\.io/placement`

  if (!targetPath) {
    return null
  }

  return <Sync kind={PlacementKind} path="metadata.name" targetKind="ApplicationSet" targetPath={targetPath} />
}

function ExistingPlacementSelect(props: { placements: IPlacement[] }) {
  const { t } = useTranslation()
  const item = useContext(ItemContext)
  const path = `${findGeneratorPathWithGenType(item, 'clusterDecisionResource')}.labelSelector.matchLabels.cluster\\.open-cluster-management\\.io/placement`

  if (!path) {
    return null
  }

  return (
    <WizSelect
      path={path}
      label={t('Existing placement')}
      placeholder={t('Select the existing placement')}
      options={props.placements.map((placement) => placement.metadata?.name ?? '')}
    />
  )
}
