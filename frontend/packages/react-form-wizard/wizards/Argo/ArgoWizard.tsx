import { Button, Flex, FlexItem, Split, Stack, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core'
import { GitAltIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import {
    WizAsyncSelect,
    WizDetailsHidden,
    EditMode,
    WizHidden,
    WizItemSelector,
    WizMultiSelect,
    Radio,
    WizRadioGroup,
    Section,
    WizSelect,
    Step,
    WizTextDetail,
    Tile,
    WizTiles,
    WizTimeRange,
    WizardCancel,
    WizardPage,
    WizardSubmit,
    WizArrayInput,
    WizCheckbox,
    WizTextInput,
} from '../../src'
import { useData } from '../../src/contexts/DataContext'
import { useEditMode } from '../../src/contexts/EditModeContext'
import { useItem } from '../../src/contexts/ItemContext'
import { IResource } from '../../src/common/resource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { IPlacement, PlacementApiVersion, PlacementKind, PlacementType } from '../common/resources/IPlacement'
import { Sync } from '../../src/Sync'
import { isValidKubernetesResourceName, validateWebURL } from '../common/validation'
import { Placement } from '../Placement/Placement'
import HelmIcon from './logos/HelmIcon.svg'

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
                source: {
                    path?: string
                    repoURL: string
                    targetRevision?: string
                    chart?: string
                }
                syncPolicy?: any
            }
        }
    }
    transformed?: {
        clusterCount?: string
    }
}

interface ArgoWizardProps {
    breadcrumb?: { label: string; to?: string }[]
    applicationSets?: ApplicationSet[]
    createClusterSetCallback?: () => void
    clusters: IResource[]
    clusterSets: IResource[]
    clusterSetBindings: IClusterSetBinding[]
    ansibleCredentials: string[]
    argoServers: { label: string; value: string; description?: string }[]
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
                  secretRef?: string | undefined
                  namespace?: string | undefined
              }
            | undefined
    ) => Promise<unknown>
    getGitPaths: (
        channelPath: string,
        branch: string,
        secretArgs?:
            | {
                  secretRef?: string | undefined
                  namespace?: string | undefined
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

    const requeueTimes = useMemo(() => [30, 60, 120, 180, 300], [])

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
                if (!appset.spec.template?.spec?.source.chart) {
                    gitArgoAppSetRepoURLs.push(appset.spec.template?.spec?.source.repoURL as string)
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
                if (appset.spec.template?.spec?.source.chart) {
                    helmArgoAppSetRepoURLs.push(appset.spec.template?.spec?.source.repoURL)
                }
            })
        }
        return [...(sourceHelmChannels ?? []), ...createdChannels, ...(helmArgoAppSetRepoURLs ?? [])].filter(onlyUnique)
    }, [createdChannels, props.applicationSets, sourceHelmChannels])

    const [gitRevisionsAsyncCallback, setGitRevisionsAsyncCallback] = useState<() => Promise<string[]>>()
    const [gitPathsAsyncCallback, setGitPathsAsyncCallback] = useState<() => Promise<string[]>>()
    const editMode = useEditMode()

    useEffect(() => {
        const applicationSet: any = resources?.find((resource) => resource.kind === 'ApplicationSet')
        if (applicationSet) {
            const channel = gitChannels.find((channel: any) => channel === applicationSet.spec.template.spec.source.repoURL)
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
                            applicationSet.spec.template.spec.source.targetRevision,
                            props.getGitPaths
                        )
                )
            }
        }
    }, [props.channels, props.getGitPaths, props.getGitRevisions, resources, gitChannels])

    return (
        <WizardPage
            breadcrumb={props.breadcrumb}
            title={props.resources ? 'Edit application set' : 'Create application set'}
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
                                        labelSelector: { matchLabels: { 'cluster.open-cluster-management.io/placement': '-placement' } },
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
                                    source: {},
                                    destination: { namespace: '', server: '{{server}}' },
                                    syncPolicy: {
                                        automated: {
                                            selfHeal: true,
                                        },
                                        syncOptions: ['CreateNamespace=true'],
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
            <Step id="general" label="General">
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
                    <Section label="General">
                        <WizTextInput
                            path="metadata.name"
                            label="ApplicationSet name"
                            placeholder="Enter the application set name"
                            required
                            id="name"
                            validation={isValidKubernetesResourceName}
                        />
                        <WizSelect
                            id="namespace"
                            path="metadata.namespace"
                            label="Argo server"
                            placeholder="Select the Argo server"
                            labelHelp="Argo server to deploy Argo app set. Click the Add cluster sets tab to create a new cluster set."
                            options={props.argoServers}
                            required
                        />
                        <WizSelect
                            path="spec.generators.0.clusterDecisionResource.requeueAfterSeconds"
                            label="Requeue time"
                            options={requeueTimes}
                            labelHelp="Cluster decision resource requeue time in seconds"
                            required
                        />
                    </Section>
                </WizItemSelector>
            </Step>
            <Step id="template" label="Template">
                <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
                    <Section label="Source">
                        <WizTiles
                            path="spec.template.spec.source"
                            label="Repository type"
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
                            <Tile id="git" value="Git" label="Git" icon={<GitAltIcon />} description="Use a Git repository" />
                            <Tile id="helm" value="Helm" label="Helm" icon={<HelmIcon />} description="Use a Helm repository" />
                        </WizTiles>
                        {/* Git repo */}
                        <WizHidden hidden={(data) => data.spec.template.spec.source.path === undefined}>
                            <WizSelect
                                path="spec.template.spec.source.repoURL"
                                label="URL"
                                labelHelp="The URL path for the Git repository."
                                placeholder="Enter or select a Git URL"
                                options={gitChannels}
                                onValueChange={(value) => {
                                    const channel = props.channels?.find((channel) => channel.spec.pathname === value)
                                    setGitRevisionsAsyncCallback(
                                        () => () =>
                                            getGitBranchList(
                                                {
                                                    metadata: { name: channel?.metadata?.name, namespace: channel?.metadata?.namespace },
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
                                                    { metadata: { name: '', namespace: '' }, spec: { pathname: value, type: 'git' } },
                                                    props.getGitRevisions
                                                )
                                        )
                                        return [...channels]
                                    })
                                }
                                // TODO valid URL
                            />
                            <WizHidden hidden={(data) => data.spec.template.spec.source.repoURL === ''}>
                                <WizAsyncSelect
                                    path="spec.template.spec.source.targetRevision"
                                    label="Revision"
                                    labelHelp="Refer to a single commit"
                                    placeholder="Enter or select a tracking revision"
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
                                                        spec: { pathname: channel?.spec.pathname || path || '', type: 'git' },
                                                    },
                                                    value as string,
                                                    props.getGitPaths
                                                )
                                        )
                                    }}
                                />
                                <WizAsyncSelect
                                    path="spec.template.spec.source.path"
                                    label="Path"
                                    labelHelp="The location of the resources on the Git repository."
                                    placeholder="Enter or select a repository path"
                                    isCreatable
                                    asyncCallback={gitPathsAsyncCallback}
                                />
                            </WizHidden>
                        </WizHidden>
                        {/* Helm repo */}
                        <WizHidden hidden={(data) => data.spec.template.spec.source.chart === undefined}>
                            <WizSelect
                                path="spec.template.spec.source.repoURL"
                                label="URL"
                                labelHelp="The URL path for the Helm repository."
                                placeholder="Enter or select a Helm URL"
                                options={helmChannels}
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
                                                    { metadata: { name: '', namespace: '' }, spec: { pathname: value, type: 'git' } },
                                                    props.getGitRevisions
                                                )
                                        )
                                        return [...channels]
                                    })
                                }
                                // TODO valid URL
                            />
                            <WizTextInput
                                path="spec.template.spec.source.chart"
                                label="Chart name"
                                placeholder="Enter the name of the Helm chart"
                                labelHelp="The specific name for the target Helm chart."
                                required
                            />
                            <WizTextInput
                                path="spec.template.spec.source.targetRevision"
                                label="Package version"
                                placeholder="Enter the version or versions"
                                labelHelp="The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0."
                                required
                            />
                        </WizHidden>
                    </Section>
                    <Section label="Destination">
                        <WizTextInput
                            id="destination"
                            path="spec.template.spec.destination.namespace"
                            label="Remote namespace"
                            placeholder="Enter the destination namespace"
                            required
                        />
                    </Section>
                </WizItemSelector>
            </Step>
            <Step id="sync-policy" label="Sync policy">
                <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
                    <Section
                        label="Sync policy"
                        description="Settings used to configure application syncing when there are differences between the desired state and the live cluster state."
                    >
                        <WizCheckbox
                            label="Delete resources that are no longer defined in the source repository"
                            path="spec.template.spec.syncPolicy.automated.prune"
                        />
                        <WizCheckbox
                            id="prune-last"
                            label="Delete resources that are no longer defined in the source repository at the end of a sync operation"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={booleanToSyncOptions('PruneLast')}
                            pathValueToInputValue={syncOptionsToBoolean('PruneLast')}
                        />
                        <WizCheckbox
                            id="replace"
                            label="Replace resources instead of applying changes from the source repository"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={booleanToSyncOptions('Replace')}
                            pathValueToInputValue={syncOptionsToBoolean('Replace')}
                        />

                        <WizCheckbox
                            path="spec.template.spec.syncPolicy.automated.allowEmpty"
                            label="Allow applications to have empty resources"
                        />
                        <WizCheckbox
                            id="apply-out-of-sync-only"
                            label="Only synchronize out-of-sync resources"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={booleanToSyncOptions('ApplyOutOfSyncOnly')}
                            pathValueToInputValue={syncOptionsToBoolean('ApplyOutOfSyncOnly')}
                        />
                        <WizCheckbox
                            path="spec.template.spec.syncPolicy.automated.selfHeal"
                            label="Automatically sync when cluster state changes"
                        />
                        <WizCheckbox
                            id="create-namespace"
                            label="Automatically create namespace if it does not exist"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={booleanToSyncOptions('CreateNamespace')}
                            pathValueToInputValue={syncOptionsToBoolean('CreateNamespace')}
                        />
                        <WizCheckbox
                            id="validate"
                            label="Disable kubectl validation"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={booleanToSyncOptions('Validate')}
                            pathValueToInputValue={syncOptionsToBoolean('Validate')}
                        />
                        <WizCheckbox
                            id="propagation-policy"
                            label="Prune propagation policy"
                            path="spec.template.spec.syncPolicy.syncOptions"
                            inputValueToPathValue={checkboxPrunePropagationPolicyToSyncOptions}
                            pathValueToInputValue={checkboxSyncOptionsToPrunePropagationPolicy}
                        >
                            <WizSelect
                                label="Propogation policy"
                                options={['foreground', 'background', 'orphan']}
                                path="spec.template.spec.syncPolicy.syncOptions"
                                inputValueToPathValue={prunePropagationPolicyToSyncOptions}
                                pathValueToInputValue={syncOptionsToPrunePropagationPolicy}
                                required
                            />
                        </WizCheckbox>
                    </Section>
                </WizItemSelector>
            </Step>
            <Step id="placement" label="Placement">
                <ArgoWizardPlacementSection
                    placements={props.placements}
                    clusters={props.clusters}
                    clusterSets={props.clusterSets}
                    clusterSetBindings={props.clusterSetBindings}
                    createClusterSetCallback={props.createClusterSetCallback}
                />
            </Step>
        </WizardPage>
    )
}

export function DeploymentWindow(props: { timeZone: string[] }) {
    return (
        <Section
            hidden={(data) => {
                return data.deployType === 'ArgoCD'
            }}
            id="deploymentWindow.title"
            label="Deployment window"
            description="Schedule a time window for deployments"
            labelHelp="Define a time window if you want to activate or block resources deployment within a certain time interval."
        >
            <WizRadioGroup
                id="remediation"
                path="deployment.window"
                required
                // hidden={get(resources, 'DELEM') === undefined}
            >
                <Radio id="always" label="Always active" value="always" />
                <Radio id="active" label="Active within specified interval" value="active">
                    <TimeWindow timeZone={props.timeZone} />
                </Radio>
                <Radio id="blocked" label="Blocked within specified interval" value="blocked">
                    <TimeWindow timeZone={props.timeZone} />
                </Radio>
            </WizRadioGroup>
        </Section>
    )
}

export function TimeWindow(props: { timeZone: string[] }) {
    return (
        <Stack hasGutter style={{ paddingBottom: 16 }}>
            <WizMultiSelect
                label="Time window configuration"
                placeholder="Select at least one day to create a time window."
                path="timewindow.daysofweek"
                required
                options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
            />
            <WizSelect path="timeWindow.timezone" label="Time zone" placeholder="Select the time zone" options={props.timeZone} required />
            <WizArrayInput
                path="timeWindows"
                placeholder="Add time range"
                collapsedContent={
                    <Fragment>
                        <WizTextDetail path="start" placeholder="Expand to enter the variable" />
                        <WizHidden hidden={(item: ITimeRangeVariableData) => item.end === undefined}>
                            &nbsp;-&nbsp;
                            <WizTextDetail path="end" />
                        </WizHidden>
                    </Fragment>
                }
            >
                <Split hasGutter>
                    <WizTimeRange path="start" label="Start Time"></WizTimeRange>
                    <WizTimeRange path="end" label="End Time"></WizTimeRange>
                </Split>
            </WizArrayInput>
        </Stack>
    )
}

async function getGitBranchList(
    channel: Channel,
    getGitBranches: (channelPath: string, secretArgs?: { secretRef?: string; namespace?: string } | undefined) => Promise<unknown>
) {
    return getGitBranches(channel.spec.pathname, {
        secretRef: channel.spec?.secretRef?.name,
        namespace: channel.metadata?.namespace,
    }) as Promise<string[]>
}

async function getGitPathList(
    channel: Channel,
    branch: string,
    getGitPaths: (channelPath: string, branch: string, secretArgs?: { secretRef?: string; namespace?: string }) => Promise<unknown>
): Promise<string[]> {
    return getGitPaths(channel?.spec?.pathname, branch, {
        secretRef: channel?.spec?.secretRef?.name,
        namespace: channel.metadata?.namespace,
    }) as Promise<string[]>
}

export function ExternalLinkButton(props: { id: string; href?: string; icon?: ReactNode }) {
    return (
        <Flex>
            <FlexItem spacer={{ default: 'spacerXl' }}>
                <Button id={props.id} icon={props.icon} size="sm" variant="link" component="a" href={props.href} target="_blank">
                    Add cluster sets
                </Button>
            </FlexItem>
        </Flex>
    )
}

interface ITimeRangeVariableData {
    start: string
    end: string
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
        const index = newArray.findIndex((entry) => typeof entry === 'string' && entry.startsWith(`PrunePropagationPolicy=`))
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
    const resources = useItem() as IResource[]
    const editMode = useEditMode()
    const hasPlacement = resources.find((r) => r.kind === PlacementKind) !== undefined
    const applicationSet = resources.find((r) => r.kind === 'ApplicationSet')
    const placements = props.placements.filter((placement) => placement.metadata?.namespace === applicationSet?.metadata?.namespace)
    const namespaceClusterSetNames =
        props.clusterSetBindings
            ?.filter((clusterSetBinding) => clusterSetBinding.metadata?.namespace === applicationSet?.metadata?.namespace)
            .filter((clusterSetBinding) =>
                props.clusterSets?.find((clusterSet) => clusterSet.metadata?.name === clusterSetBinding.spec?.clusterSet)
            )
            .map((clusterSetBinding) => clusterSetBinding.spec?.clusterSet ?? '') ?? []

    const { update } = useData()
    return (
        <Section label="Placement">
            {(editMode === EditMode.Create || !hasPlacement) && (
                <WizDetailsHidden>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {editMode === EditMode.Create && (
                            <span className="pf-v5-c-form__label pf-v5-c-form__label-text">How do you want to select clusters?</span>
                        )}
                        <ToggleGroup>
                            <ToggleGroupItem
                                text="New placement"
                                isSelected={hasPlacement}
                                onClick={() => {
                                    let newResources = [...resources]
                                    newResources = resources.filter((resource) => resource.kind !== PlacementKind)
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
                                text="Existing placement"
                                isSelected={!hasPlacement}
                                onClick={() => {
                                    let newResources = [...resources]
                                    newResources = resources.filter((resource) => resource.kind !== PlacementKind)
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
                    />
                </WizItemSelector>
            ) : (
                <WizItemSelector selectKey="kind" selectValue="ApplicationSet">
                    <WizSelect
                        path="spec.generators.0.clusterDecisionResource.labelSelector.matchLabels.cluster\.open-cluster-management\.io/placement"
                        label="Existing placement"
                        options={placements.map((placement) => placement.metadata?.name ?? '')}
                    />
                </WizItemSelector>
            )}
        </Section>
    )
}
