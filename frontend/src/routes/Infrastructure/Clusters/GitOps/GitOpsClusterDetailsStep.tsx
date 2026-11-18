/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Section,
  useData,
  useItem,
  WizCheckbox,
  WizCustomWrapper,
  WizHidden,
  WizItemSelector,
  WizSingleSelect,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Gallery,
  GalleryItem,
  Label,
  List,
  ListItem,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useEffect, useRef, useState } from 'react'
import { useValidation } from '~/hooks/useValidation'
import { useTranslation } from '~/lib/acm-i18next'
import { DOC_LINKS } from '~/lib/doc-util'
import type { IResource } from '~/resources'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import type { Placement as PlacementResource } from '~/resources/placement'
import type { Policy } from '~/resources/policy'
import type { SubscriptionOperator } from '~/resources/subscription-operator'
import {
  AppProjectKind,
  ArgoCDKind,
  buildGitOpsClusterResources,
  collectMissingPermissions,
  findArgoCDInNamespace,
  formatMissingPermissions,
  getGitOpsClusterFromResources,
  getPlacementFromResources,
  isAgentEnabled,
  isPushModelEnabled,
  policyNameFor,
  preferDraftManagedClusterSetBindings,
  type GitOpsClusterWizardData,
  type MissingPermission,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'

export interface GitOpsClusterDetailsStepProps {
  namespaces: string[]
  editMode: EditMode
  argoCDs: IResource[]
  subscriptions: SubscriptionOperator[]
  policies: Policy[]
  existingBindings?: ManagedClusterSetBinding[]
  existingAppProject?: IResource
  loadExistingAppProject?: () => Promise<IResource | undefined>
}

type PullModelId = 'agent' | 'manifestwork'

interface PullModelComparisonRow {
  term: string
  description: string
}

interface PullModelOption {
  id: PullModelId
  title: string
  description: string
  recommended?: boolean
  rows: PullModelComparisonRow[]
  learnMoreHref: string
  learnMoreLabel: string
}

export function GitOpsClusterDetailsStep(props: Readonly<GitOpsClusterDetailsStepProps>) {
  const { t } = useTranslation()
  const { validateKubernetesResourceName } = useValidation()

  return (
    <>
      <GitOpsPermissionAlert />
      <WizItemSelector selectKey="kind" selectValue={GitOpsClusterKind}>
        <Section label={t('Details')}>
          <WizTextInput
            label={t('Name')}
            id="name"
            path="metadata.name"
            required
            placeholder={t('Enter the name')}
            validation={validateKubernetesResourceName}
            disabled={props.editMode === EditMode.Edit}
          />
          <WizSingleSelect
            label={t('Namespace')}
            id="namespace"
            path="metadata.namespace"
            placeholder={t('Select the Argo CD namespace')}
            options={props.namespaces}
            required
            disabled={props.editMode === EditMode.Edit}
            helperText={t('Select the namespace of the hub Argo CD instance.')}
          />
          <PullModelSelector loadExistingAppProject={props.loadExistingAppProject} />
          <WizHidden hidden={(item: GitOpsClusterWizardData) => !isAgentEnabled(item)}>
            <WizCheckbox
              id="enable-push-model"
              path="transformed.pushModelEnabled"
              label={t('Enable Push model with Argo CD Agent')}
              helperText={t(
                'Keeps the hub Argo CD controller enabled for hybrid Push and Agent deployments. When unchecked, the hub controller is disabled.'
              )}
            />
          </WizHidden>
        </Section>
      </WizItemSelector>
      <AgentResourcesSync
        editMode={props.editMode}
        argoCDs={props.argoCDs}
        subscriptions={props.subscriptions}
        policies={props.policies}
        existingBindings={props.existingBindings ?? []}
        existingAppProject={props.existingAppProject}
      />
    </>
  )
}

function PullModelSelector(props: Readonly<{ loadExistingAppProject?: () => Promise<IResource | undefined> }>) {
  const { t } = useTranslation()
  // Inside WizItemSelector the item is the GitOpsCluster, not the resources array.
  const gitOpsCluster = useItem() as GitOpsClusterWizardData
  const { update } = useData()
  const [projectError, setProjectError] = useState<Error>()
  const selectionRequest = useRef(0)
  const agentEnabled = isAgentEnabled(gitOpsCluster)
  const selected: PullModelId = agentEnabled ? 'agent' : 'manifestwork'

  const options: PullModelOption[] = [
    {
      id: 'agent',
      title: t('Argo CD Agent pull'),
      description: t('Future-proof, high-performance architecture built for massive scale.'),
      recommended: true,
      rows: [
        {
          term: t('Scale & performance'),
          description: t('High performance. Offloads processing to managed clusters for improved scalability.'),
        },
        {
          term: t('Feature experience'),
          description: t('Native experience. Delivers real-time status updates and a richer feature set.'),
        },
        {
          term: t('Cluster footprint'),
          description: t('Optimized agent footprint with a dedicated component on managed clusters.'),
        },
        {
          term: t('Setup & integration'),
          description: t(
            'Advanced integration. Establishes gRPC communication channel between hub and managed clusters.'
          ),
        },
      ],
      learnMoreHref: DOC_LINKS.GITOPS_CLUSTER_AGENT_PULL,
      learnMoreLabel: t('Learn more about Argo CD Agent pull'),
    },
    {
      id: 'manifestwork',
      title: t('Argo CD ManifestWork pull'),
      description: t(
        'Legacy, plug-and-play setup that utilizes your existing framework without adding new agent components.'
      ),
      rows: [
        {
          term: t('Scale & performance'),
          description: t('Standard performance. Uses hub-side processing through the ManifestWork framework.'),
        },
        {
          term: t('Feature experience'),
          description: t('Basic experience. Provides essential status reporting with limited real-time updates.'),
        },
        {
          term: t('Cluster footprint'),
          description: t('Minimal footprint. No additional agent components on managed clusters.'),
        },
        {
          term: t('Setup & integration'),
          description: t('Plug-and-play. Uses the existing ManifestWork framework with no extra setup.'),
        },
      ],
      learnMoreHref: DOC_LINKS.GITOPS_CLUSTER_MANIFESTWORK_PULL,
      learnMoreLabel: t('Learn more about Argo CD ManifestWork pull'),
    },
  ]

  const selectedOption = options.find((option) => option.id === selected) ?? options[1]

  const setPullModel = async (model: PullModelId) => {
    const request = ++selectionRequest.current
    setProjectError(undefined)
    if (model === 'agent' && props.loadExistingAppProject) {
      try {
        await props.loadExistingAppProject()
      } catch (error) {
        if (request === selectionRequest.current) setProjectError(error as Error)
        return
      }
    }
    if (request !== selectionRequest.current) return
    if (!gitOpsCluster || model === selected) return

    if (model === 'manifestwork') {
      const addon = gitOpsCluster.spec?.gitopsAddon
      if (gitOpsCluster.spec && addon?.argoCDAgent) {
        gitOpsCluster.spec.gitopsAddon = { ...addon, argoCDAgent: { ...addon.argoCDAgent, enabled: false } }
      }
      gitOpsCluster.transformed = { ...gitOpsCluster.transformed, pushModelEnabled: false }
    } else {
      gitOpsCluster.spec = {
        ...gitOpsCluster.spec,
        gitopsAddon: {
          ...gitOpsCluster.spec?.gitopsAddon,
          enabled: true,
          argoCDAgent: {
            ...gitOpsCluster.spec?.gitopsAddon?.argoCDAgent,
            enabled: true,
          },
        },
      }
    }
    update()
  }

  return (
    <WizCustomWrapper
      id="pull-model-configuration"
      path="spec.gitopsAddon.argoCDAgent.enabled"
      label={t('Pull model configuration')}
      value={selectedOption.title}
    >
      <Stack hasGutter>
        {projectError && (
          <Alert isInline variant="danger" title={t('Failed to load AppProject')}>
            {projectError.message}
          </Alert>
        )}
        <StackItem>
          <span className="pf-v6-c-form__label pf-v6-c-form__label-text">{t('Select Pull model configuration')}</span>
          <Content component="p">
            {t(
              'Select the Pull model this GitOps configuration will use. The Pull model defines where ApplicationSet reconciliation and status reporting occur.'
            )}
          </Content>
        </StackItem>
        <StackItem>
          <Gallery hasGutter minWidths={{ default: '280px' }}>
            {options.map((option) => (
              <GalleryItem key={option.id}>
                <PullModelCard
                  option={option}
                  isSelected={selected === option.id}
                  onSelect={() => setPullModel(option.id)}
                />
              </GalleryItem>
            ))}
          </Gallery>
        </StackItem>
      </Stack>
    </WizCustomWrapper>
  )
}

function PullModelCard(
  props: Readonly<{
    option: PullModelOption
    isSelected: boolean
    onSelect: () => void
  }>
) {
  const { t } = useTranslation()
  const { option, isSelected, onSelect } = props
  const cardId = `pull-model-${option.id}`

  return (
    <Card
      id={cardId}
      isFullHeight
      isSelectable
      isSelected={isSelected}
      isClicked={isSelected}
      onClick={onSelect}
      style={{ height: '100%' }}
    >
      <CardHeader
        selectableActions={{
          selectableActionId: `${cardId}-select`,
          selectableActionAriaLabelledby: cardId,
          name: 'pull-model-configuration',
          variant: 'single',
          isHidden: true,
          onChange: onSelect,
        }}
        actions={
          option.recommended
            ? {
                actions: <Label color="blue">{t('Recommended')}</Label>,
                hasNoOffset: true,
              }
            : undefined
        }
      >
        <CardTitle>{option.title}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Content component="p">{option.description}</Content>
          </StackItem>
          <StackItem>
            <DescriptionList isCompact>
              {option.rows.map((row) => (
                <DescriptionListGroup key={`${option.id}-${row.term}`}>
                  <DescriptionListTerm>{row.term}</DescriptionListTerm>
                  <DescriptionListDescription>{row.description}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button
          variant="link"
          isInline
          component="a"
          href={option.learnMoreHref}
          target="_blank"
          rel="noreferrer"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
          onClick={(event) => event.stopPropagation()}
        >
          {option.learnMoreLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

function resolveDraftAgentExtras(
  resources: IResource[],
  options: Readonly<{
    name: string
    namespace: string
    argoCDs: IResource[]
    subscriptions: SubscriptionOperator[]
    policies: Policy[]
  }>
) {
  const { name, namespace, argoCDs, subscriptions, policies } = options
  // Prefer the wizard/YAML copy so rebuilds (e.g. Push toggle) do not wipe in-progress edits.
  const argoCD =
    (resources.find((item) => item.kind === ArgoCDKind && item.metadata?.namespace === namespace) as
      IResource | undefined) ?? findArgoCDInNamespace(argoCDs, namespace)
  const policyName = policyNameFor(name)
  const existingPolicy =
    (resources.find(
      (item) => item.kind === 'Policy' && item.metadata?.namespace === namespace && item.metadata?.name === policyName
    ) as Policy | undefined) ??
    policies.find((policy) => policy.metadata.namespace === namespace && policy.metadata.name === policyName)
  const existingSubscription =
    (resources.find((item) => item.kind === 'Subscription') as SubscriptionOperator | undefined) ??
    subscriptions.find(
      (subscription) =>
        subscription.spec?.name === 'openshift-gitops-operator' ||
        subscription.metadata?.name === 'openshift-gitops-operator'
    )
  const existingAppProject = resources.find(
    (item) => item.kind === AppProjectKind && item.metadata?.namespace === namespace
  )
  const currentBindings = resources.filter(
    (item) => item.kind === 'ManagedClusterSetBinding' && item.metadata?.namespace === namespace
  ) as ManagedClusterSetBinding[]

  return { argoCD, existingPolicy, existingSubscription, existingAppProject, currentBindings }
}

function applyAgentFlagsToDraft(
  resources: IResource[],
  options: Readonly<{ name: string; agentEnabled: boolean; pushModelEnabled: boolean }>
) {
  const nextGitOps = getGitOpsClusterFromResources(resources)
  if (!nextGitOps) return

  nextGitOps.metadata.name = options.name
  nextGitOps.transformed = {
    pushModelEnabled: options.agentEnabled ? options.pushModelEnabled : false,
  }
  if (options.agentEnabled) {
    const existingAddon = nextGitOps.spec?.gitopsAddon
    nextGitOps.spec = {
      ...nextGitOps.spec,
      gitopsAddon: {
        ...existingAddon,
        enabled: true,
        argoCDAgent: { ...existingAddon?.argoCDAgent, enabled: true },
      },
    }
    return
  }
}

function preservePlacementDraftEdits(resources: IResource[], placement: PlacementResource | undefined) {
  if (!placement) return
  const nextPlacement = getPlacementFromResources(resources)
  if (!nextPlacement) return

  nextPlacement.spec = { ...placement.spec, ...nextPlacement.spec }
  if (placement.spec?.predicates) {
    nextPlacement.spec.predicates = placement.spec.predicates
  }
  if (placement.spec?.tolerations) {
    nextPlacement.spec.tolerations = placement.spec.tolerations
  }
  if (placement.spec?.clusterSets) {
    nextPlacement.spec.clusterSets = placement.spec.clusterSets
  }
}

function AgentResourcesSync(
  props: Readonly<{
    editMode: EditMode
    argoCDs: IResource[]
    subscriptions: SubscriptionOperator[]
    policies: Policy[]
    existingBindings: ManagedClusterSetBinding[]
    existingAppProject?: IResource
  }>
) {
  const resources = useItem() as IResource[]
  const { update } = useData()
  const gitOpsCluster = getGitOpsClusterFromResources(resources)
  const placement = getPlacementFromResources(resources)
  const lastKey = useRef('')
  const previousNameRef = useRef(gitOpsCluster?.metadata?.name ?? '')

  const name = gitOpsCluster?.metadata?.name ?? ''
  const namespace = gitOpsCluster?.metadata?.namespace ?? ''
  const placementNamespace = placement?.metadata?.namespace
  const agentEnabled = isAgentEnabled(gitOpsCluster)
  const pushModelEnabled = isPushModelEnabled(gitOpsCluster)
  const clusterSetsKey = (placement?.spec?.clusterSets ?? []).join(',')

  useEffect(() => {
    if (!namespace || !gitOpsCluster) return
    // Preserve invalid YAML for submit-time validation instead of silently moving
    // a live Placement into another namespace or throwing from this effect.
    if (props.editMode === EditMode.Edit && placementNamespace && placementNamespace !== namespace) return

    const syncKey = `${name}|${namespace}|${agentEnabled}|${pushModelEnabled}|${clusterSetsKey}|${resources
      .map((r) => r.kind)
      .join(',')}`
    const needsRebuild = syncKey !== lastKey.current || agentEnabled !== resources.some((r) => r.kind === ArgoCDKind)
    if (!needsRebuild) return

    const previousGitOpsClusterName = previousNameRef.current
    const clusterSets = clusterSetsKey ? clusterSetsKey.split(',') : []
    const { argoCD, existingPolicy, existingSubscription, existingAppProject, currentBindings } =
      resolveDraftAgentExtras(resources, {
        name,
        namespace,
        argoCDs: props.argoCDs,
        subscriptions: props.subscriptions,
        policies: props.policies,
      })

    const next = buildGitOpsClusterResources({
      name: name || 'gitopscluster',
      namespace,
      agentEnabled,
      pushModelEnabled,
      clusterSets,
      existingGitOpsCluster: gitOpsCluster,
      existingPlacement: placement as PlacementResource | undefined,
      existingBindings: preferDraftManagedClusterSetBindings({
        namespace,
        clusterSets,
        draftBindings: currentBindings,
        liveBindings: props.existingBindings,
      }),
      existingArgoCD: argoCD,
      existingAppProject: existingAppProject ?? props.existingAppProject,
      existingSubscription,
      existingPolicy,
      includeBindings: true,
      previousGitOpsClusterName,
    })

    applyAgentFlagsToDraft(next, { name, agentEnabled, pushModelEnabled })
    preservePlacementDraftEdits(next, placement as PlacementResource | undefined)

    previousNameRef.current = name
    lastKey.current = `${name}|${namespace}|${agentEnabled}|${pushModelEnabled}|${clusterSetsKey}|${next
      .map((r) => r.kind)
      .join(',')}`
    update(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when agent/push/name/namespace/clusterSets change
  }, [
    agentEnabled,
    pushModelEnabled,
    name,
    namespace,
    placementNamespace,
    clusterSetsKey,
    update,
    props.existingAppProject,
    props.editMode,
  ])

  return null
}

function GitOpsPermissionAlert() {
  const { t } = useTranslation()
  const resources = useItem() as IResource[]
  const [checked, setChecked] = useState<{ identityKey: string; missing: MissingPermission[] }>()
  const resourcesRef = useRef(resources)
  resourcesRef.current = resources
  const identityKey = JSON.stringify(
    resources
      .map((resource) => [resource.kind, resource.metadata?.namespace, resource.metadata?.name])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  )

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      void collectMissingPermissions(resourcesRef.current)
        .then((result) => {
          if (!cancelled) setChecked({ identityKey, missing: result })
        })
        .catch(() => {
          if (!cancelled) setChecked({ identityKey, missing: [] })
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [identityKey])

  const missing = checked?.identityKey === identityKey ? checked.missing : []
  if (missing.length === 0) return null

  return (
    <Alert
      isInline
      variant="danger"
      title={t('You do not have permission to create or update all required resources.')}
      style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}
    >
      <List>
        {formatMissingPermissions(missing).map((item) => (
          <ListItem key={item}>{item}</ListItem>
        ))}
      </List>
    </Alert>
  )
}
