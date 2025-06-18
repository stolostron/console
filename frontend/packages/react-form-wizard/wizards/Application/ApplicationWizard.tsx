import { Button, Flex, FlexItem, Split, Stack } from '@patternfly/react-core'
import { GitAltIcon, PlusCircleIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import {
    WizHidden,
    WizKeyValue,
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
import { useItem } from '../../src/contexts/ItemContext'
import ArgoIcon from './logos/ArgoIcon.svg'
import HelmIcon from './logos/HelmIcon.svg'
import ObjectStore from './logos/ObjectStore.svg'
import SubscriptionIcon from './logos/SubscriptionIcon.svg'

interface ApplicationWizardProps {
    addClusterSets?: string
    ansibleCredentials: string[]
    argoServers: string[]
    namespaces: string[]
    onSubmit: WizardSubmit
    onCancel: WizardCancel
    placements: string[]
    channels: Channel[]
    timeZones: string[]
}

interface IData {
    namespace: string
    newNamespace: boolean
    channels: Record<string, boolean>
}

interface Channel {
    metadata: {
        name: string
        namespace: string
    }
    spec: {
        pathname: string
        type: string
        secretRef?: { name: string }
    }
}

export function ApplicationWizard(props: ApplicationWizardProps) {
    const reconcileOptions = useMemo(() => ['merge', 'replace'], [])
    const reconcileRates = useMemo(() => ['medium', 'low', 'high', 'off'], [])
    const requeueTimes = useMemo(() => [30, 60, 120, 180, 300], [])
    const urls = useMemo(() => ['url1', 'url2'], [])
    const urlOptions = useMemo(() => ['url1', 'url2'], [])
    const gitChannels = useMemo(
        () => props.channels.filter((channel) => channel.spec.type === 'Git' || channel.spec.type === 'GitHub'),
        [props.channels]
    )
    const helmChannels = useMemo(() => props.channels.filter((channel) => channel.spec.type === 'HelmRepo'), [props.channels])
    const subscriptionGitChannels = gitChannels.map((gitChannel: Channel) => {
        const { name, namespace } = gitChannel.metadata
        const { pathname } = gitChannel.spec
        return {
            name: name || '',
            namespace: namespace || '',
            pathname: pathname || '',
        }
    })
    return (
        <WizardPage
            title="Create application"
            defaultData={{ curlyServer: '{{server}}', curlyName: '{{name}}', uniqueGroupID: 1 }}
            onCancel={props.onCancel}
            onSubmit={props.onSubmit}
        >
            <Step id="type" label="Type">
                <Section label="Type" prompt="Type">
                    <WizTiles path="deployType" label="Select the application management type to deploy this application into clusters.">
                        <Tile
                            id="subscription"
                            value="Subscription"
                            label="Subscription"
                            icon={<SubscriptionIcon />}
                            description="Subscriptions are Kubernetes resources within channels (source repositories)"
                        />
                        <Tile
                            id="argoCD"
                            value="ArgoCD"
                            label="Argo CD ApplicationSet"
                            icon={<ArgoIcon />}
                            description="Supports deployments to large numbers of clusters, deployments of large monorepos, and enabling secure Application self-service."
                        />
                    </WizTiles>
                </Section>
            </Step>
            <Step id="details" label="Details" hidden={(item) => item.deployType !== 'Subscription'}>
                <DetailsSection namespaces={props.namespaces} />
            </Step>
            <Step id="repositories" label="Repositories" hidden={(item) => item.deployType !== 'Subscription'}>
                <Section label="Repositories" prompt="Enter the application repositories">
                    <WizArrayInput
                        path="repositories"
                        placeholder="Add repository"
                        collapsedContent={
                            <Fragment>
                                <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionGit'}>
                                    <GitAltIcon />
                                    <WizTextDetail path="subscription.git.url" placeholder="Expand to enter the repository details" />
                                </WizHidden>
                                <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionHelm'}>
                                    <HelmIcon />
                                    <WizTextDetail path="subscription.helm.url" placeholder="Expand to enter the repository details" />
                                </WizHidden>
                                <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionObjectstorage'}>
                                    <ObjectStore />
                                    <WizTextDetail path="subscription.obj.url" placeholder="Expand to enter the repository details" />
                                </WizHidden>
                            </Fragment>
                        }
                    >
                        <WizTiles path="repositoryType" label="Repository type">
                            <Tile id="git" value="SubscriptionGit" label="Git" icon={<GitAltIcon />} description="Use a Git repository" />
                            <Tile id="helm" value="SubscriptionHelm" label="Helm" icon={<HelmIcon />} description="Use a Helm repository" />
                            <Tile
                                id="objectstorage"
                                value="SubscriptionObjectstorage"
                                icon={<ObjectStore />}
                                label="Object Storage"
                                description="Use a bucket from an object storage repository"
                            />
                        </WizTiles>

                        <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionGit'}>
                            <WizSelect
                                path="subscription.git.url"
                                label="URL"
                                placeholder="Enter or select a Git URL"
                                labelHelp="The URL path for the Git repository."
                                options={subscriptionGitChannels.map((gitChannel) => ({
                                    label: gitChannel.pathname,
                                    value: `${gitChannel.namespace}/${gitChannel.name}`,
                                }))}
                                required
                            />
                            <WizTextInput
                                path="subscription.git.username"
                                label="Username"
                                placeholder="Enter the Git user name"
                                labelHelp="The username if this is a private Git repository and requires connection."
                            />
                            <WizTextInput
                                path="subscription.git.accessToken"
                                label="Access token"
                                placeholder="Enter the Git access token"
                                labelHelp="The access token if this is a private Git repository and requires connection."
                            />
                            <WizSelect
                                path="subscription.git.branch"
                                label="Branch"
                                placeholder="Enter or select a branch"
                                labelHelp="The branch of the Git repository."
                                options={['branch-1']}
                                required
                            />
                            <WizSelect
                                path="subscription.git.path"
                                label="Path"
                                placeholder="Enter or select a repository path"
                                labelHelp="The location of the resources on the Git repository."
                                options={urls}
                                required
                            />

                            <WizTextInput
                                path="subscription.git.commitHash"
                                label="Commit hash"
                                placeholder="Enter a specific commit hash"
                                labelHelp="If you want to subscribe to a specific commit, you need to specify the desired commit hash. You might need to specify git-clone-depth annotation if your desired commit is older than the last 20 commits."
                            />

                            <WizTextInput
                                path="subscription.git.tag"
                                label="Tag"
                                placeholder="Enter a specific tag"
                                labelHelp="If you want to subscribe to a specific tag, you need to specify the tag. If both Git desired commit and tag annotations are specified, the tag is ignored. You might need to specify git-clone-depth annotation if your desired commit of the tag is older than the last 20 commits."
                            />
                            <WizSelect
                                path="subscription.git.reconcileOption"
                                label="Reconcile option"
                                labelHelp="With the Merge option, new fields are added and existing fields are updated in the resource. Choose to merge if resources are updated after the initial deployment. If you choose to replace, the existing resource is replaced with the Git source."
                                options={reconcileOptions}
                                required
                            />
                            <WizSelect
                                path="subscription.git.reconcileRate"
                                label="Repository reconcile rate"
                                labelHelp="The frequency of resource reconciliation that is used as a global repository setting. The medium default setting checks for changes to apply every three minutes and re-applies all resources every 15 minutes, even without a change. Select low to reconcile every hour. Select high to reconcile every two minutes. If you select off, the deployed resources are not automatically reconciled."
                                options={reconcileRates}
                            />
                            <WizCheckbox
                                path="subscription.git.subReconcileRate"
                                label="Disable auto-reconciliation"
                                labelHelp="Turn the auto-reconciliation off for this specific application regardless of the reconcile rate setting in the repository."
                            />
                            <WizCheckbox
                                path="subscription.git.insecureSkipVerify"
                                label="Disable server certificate verification"
                                labelHelp="Disable server TLS certificate verification for Git server connection."
                            />
                            <AnsibleCredentials ansibleCredentials={props.ansibleCredentials} />
                        </WizHidden>

                        <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionHelm'}>
                            <WizSelect
                                path="subscription.helm.url"
                                label="URL"
                                placeholder="Enter or select a Helm repository URL"
                                labelHelp="The URL path for the Helm repository."
                                options={helmChannels.map((channel) => channel.metadata.name)}
                                required
                            />
                            <WizTextInput
                                path="subscription.helm.username"
                                label="Username"
                                placeholder="Enter the Helm repository username"
                                labelHelp="The username if this is a private Helm repository and requires connection."
                            />
                            <WizTextInput
                                path="subscription.helm.password"
                                label="Password"
                                placeholder="Enter the Helm repository password"
                                labelHelp="The password if this is a private Helm repository and requires connection."
                            />
                            <WizTextInput
                                path="subscription.helm.chart"
                                label="Chart name"
                                placeholder="Enter the name of the target Helm chart"
                                labelHelp="The specific name for the target Helm chart."
                                required
                            />
                            <WizTextInput
                                path="subscription.helm.packageAlias"
                                label="Package alias"
                                placeholder="Enter the alias name of the target Helm chart"
                                labelHelp="The alias name for the target Helm chart."
                                required
                            />
                            <WizTextInput
                                path="subscription.helm.packageVersion"
                                label="Package version"
                                placeholder="Enter the version or versions"
                                labelHelp="The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0."
                            />
                            <WizSelect
                                path="subscription.helm.reconcileRate"
                                label="Repository reconcile rate"
                                labelHelp="The frequency of resource reconciliation that is used as a global repository setting. The medium default setting checks for changes to apply every three minutes and re-applies all resources every 15 minutes, even without a change. Select low to reconcile every hour. Select high to reconcile every two minutes. If you select off, the deployed resources are not automatically reconciled."
                                options={reconcileRates}
                                required
                            />
                            <WizCheckbox
                                path="subscription.helm.subReconcileRate"
                                label="Disable auto-reconciliation"
                                labelHelp="Turn the auto-reconciliation off for this specific application regardless of the reconcile rate setting in the repository."
                            />
                            <WizCheckbox
                                path="subscription.helm.insecureSkipVerify"
                                label="Disable server certificate verification"
                                labelHelp="Disable server TLS certificate verification for Git server connection."
                            />
                        </WizHidden>

                        <WizHidden hidden={(data) => data.repositoryType !== 'SubscriptionObjectstorage'}>
                            <WizSelect
                                path="subscription.obj.url"
                                label="URL"
                                placeholder="Enter or select an ObjectStore bucket URL"
                                labelHelp="The URL path for the object store."
                                options={urls}
                                required
                            />
                            <WizTextInput
                                path="subscription.obj.accessKey"
                                label="Access key"
                                placeholder="Enter the object store access key"
                                labelHelp="The access key for accessing the object store."
                            />
                            <WizTextInput
                                path="subscription.obj.secretKey"
                                label="Secret key"
                                placeholder="Enter the object store secret key"
                                labelHelp="The secret key for accessing the object store."
                            />
                            <WizTextInput
                                path="subscription.obj.region"
                                label="Region"
                                placeholder="Enter the AWS region of the S3 bucket"
                                labelHelp="The AWS Region of the S3 bucket. This field is required for Amazon S3 buckets only."
                            />
                            <WizTextInput
                                path="subscription.obj.subfolder"
                                label="Subfolder"
                                placeholder="Enter the Amazon S3 or MinIO subfolder bucket path"
                                labelHelp="The Amazon S3 or MinIO subfolder bucket path. This field is optional for Amazon S3 and MinIO only."
                            />
                        </WizHidden>

                        <WizHidden hidden={(data) => data.repositoryType === undefined}>
                            <Placement placements={props.placements} />
                            <DeploymentWindow timeZone={props.timeZones} />
                        </WizHidden>
                    </WizArrayInput>
                </Section>
            </Step>
            <Step id="general" label="General" hidden={(item) => item.deployType !== 'ArgoCD'}>
                <Section label="General">
                    <WizTextInput path="appSetName" label="ApplicationSet name" placeholder="Enter the application set name" required />
                    <WizSelect
                        path="argoServer"
                        label="Argo server"
                        placeholder="Select the Argo server"
                        labelHelp="Argo server to deploy Argo app set. Click the Add cluster sets tab to create a new cluster set."
                        options={props.argoServers}
                        required
                    />
                    <ExternalLinkButton id="addClusterSets" icon={<PlusCircleIcon />} href={props.addClusterSets} />
                    <WizSelect
                        path="requeueTime"
                        label="Requeue time"
                        options={requeueTimes}
                        labelHelp="Cluster decision resource requeue time in seconds"
                        required
                    />
                </Section>
            </Step>
            <Step id="template" label="Template" hidden={(item) => item.deployType !== 'ArgoCD'}>
                <Section label="Source">
                    <WizTiles path="repositoryType" label="Repository type">
                        <Tile id="git" value="Git" label="Git" icon={<GitAltIcon />} description="Use a Git repository" />
                        <Tile id="helm" value="Helm" label="Helm" icon={<HelmIcon />} description="Use a Helm repository" />
                    </WizTiles>
                    {/* Git repo */}
                    <WizHidden hidden={(data) => data.repositoryType !== 'Git'}>
                        <WizSelect
                            path="git.url"
                            label="URL"
                            labelHelp="The URL path for the Git repository."
                            placeholder="Enter or select a Git URL"
                            options={subscriptionGitChannels.map((gitChannel) => ({
                                label: gitChannel.pathname,
                                value: `${gitChannel.namespace}/${gitChannel.name}`,
                            }))}
                            required
                        />
                        <WizSelect
                            path="git.revision"
                            label="Revision"
                            labelHelp="Refer to a single commit"
                            placeholder="Enter or select a tracking revision"
                            options={['Branches', 'Tags']}
                        />
                        <WizSelect
                            path="git.path"
                            label="Path"
                            labelHelp="The location of the resources on the Git repository."
                            placeholder="Enter or select a repository path"
                            options={urlOptions}
                        />
                    </WizHidden>
                    {/* Helm repo */}
                    <WizHidden hidden={(data) => data.repositoryType !== 'Helm'}>
                        <WizSelect
                            path="helm.url"
                            label="URL"
                            labelHelp="The URL path for the Helm repository."
                            placeholder="Enter or select a Helm URL"
                            options={helmChannels.map((channel) => channel.metadata.name)}
                            required
                        />
                        <WizTextInput
                            path="helm.chart"
                            label="Chart name"
                            placeholder="Enter the name of the Helm chart"
                            labelHelp="The specific name for the target Helm chart."
                            required
                        />
                        <WizTextInput
                            path="helm.packageVersion"
                            label="Package version"
                            placeholder="Enter the version or versions"
                            labelHelp="The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0."
                            required
                        />
                    </WizHidden>
                </Section>
                <Section label="Destination">
                    <WizTextInput path="remoteNamespace" label="Remote namespace" placeholder="Enter the destination namespace" required />
                </Section>
            </Step>
            <Step id="sync-policy" label="Sync policy" hidden={(item) => item.deployType !== 'ArgoCD'}>
                <Section
                    label="Sync policy"
                    description="Settings used to configure application syncing when there are differences between the desired state and the live cluster state."
                >
                    {/* Git only sync policies */}
                    <WizHidden hidden={(data) => data.repositoryType !== 'Git'}>
                        <WizCheckbox path="syncPolicy.prune" label="Delete resources that are no longer defined in Git" />
                        <WizCheckbox
                            path="syncPolicy.pruneLast"
                            label="Delete resources that are no longer defined in Git at the end of a sync operation"
                        />
                        <WizCheckbox path="syncPolicy.replace" label="Replace resources instead of applying changes from Git" />
                    </WizHidden>
                    <WizCheckbox path="syncPolicy.allowEmpty" label="Allow applications to have empty resources" />
                    <WizCheckbox path="syncPolicy.applyOutOfSyncOnly" label="Only synchronize out-of-sync resources" />
                    <WizCheckbox path="syncPolicy.selfHeal" label="Automatically sync when cluster state changes" />
                    <WizCheckbox path="syncPolicy.createNamespace" label="Automatically create namespace if it does not exist" />
                    <WizCheckbox path="syncPolicy.validate" label="Disable kubectl validation" />
                    <WizCheckbox path="syncPolicy.prunePropagationPolicy" label="Prune propagation policy">
                        <WizSelect
                            path="syncPolicy.propagationPolicy"
                            label="Propogation policy"
                            options={['foreground', 'background', 'orphan']}
                            required
                        />
                    </WizCheckbox>
                </Section>
            </Step>
            <Step id="placement" label="Placement" hidden={(item) => item.deployType !== 'ArgoCD'}>
                <Placement placements={props.placements} />
            </Step>
        </WizardPage>
    )
}

export function Placement(props: { placements: string[] }) {
    return (
        <Fragment>
            <Section label="Placement" description="Applications are deployed to clusters based on placements">
                <WizCheckbox
                    path="placement.useLabels"
                    label="New placement"
                    labelHelp="Deploy application resources only on clusters matching specified labels"
                >
                    <WizKeyValue
                        path="placement.labels"
                        label="Cluster labels"
                        placeholder="Enter cluster labels"
                        helperText="Placement will only select clusters matching all the specified labels"
                        required
                    />
                </WizCheckbox>
                <WizCheckbox
                    path="placement.useExisting"
                    label="Use an existing placement"
                    labelHelp="If available in the application namespace, you can select a predefined placement configuration"
                >
                    <WizSelect
                        path="placement.select"
                        label="Placement"
                        placeholder="Select an existing placement"
                        options={props.placements}
                        required
                    />
                </WizCheckbox>
            </Section>
        </Fragment>
    )
}

export function AnsibleCredentials(props: { ansibleCredentials: string[] }) {
    return (
        <Section label="Configure automation for prehook and posthook">
            <WizSelect
                path="subscription.git.ansibleSecretName"
                label="Ansible Automation Platform credential"
                labelHelp="If using Configure automation for prehook and posthook tasks, select the Ansible Automation Platform credential. Click the Add credentials tab to create a new secret."
                options={props.ansibleCredentials}
            />
        </Section>
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

function DetailsSection(props: { namespaces: string[] }) {
    const [newNamespaces, setNewNamespaces] = useState<string[]>([])
    const activeNamespaces = useMemo(() => [...props.namespaces, ...newNamespaces], [newNamespaces, props.namespaces])

    const item = useItem() as IData
    const data = useData()
    useEffect(() => {
        const namespace = item.namespace
        if (!props.namespaces.includes(namespace)) {
            if (!item.newNamespace) {
                item.newNamespace = true
                data.update()
            }
        } else {
            if (item.newNamespace) {
                item.newNamespace = false
                data.update()
            }
        }
    }, [item, data, props.namespaces])
    return (
        <Section label="Details" prompt="Enter the details of the application">
            <WizTextInput path="name" label="Application name" required />
            <WizSelect
                path="namespace"
                label="Namespace"
                placeholder="Select the namespace"
                helperText="The namespace on the hub cluster where the application resources will be created."
                options={activeNamespaces}
                isCreatable={true}
                onCreate={(namespaceName: string) => setNewNamespaces([...newNamespaces, namespaceName])}
                required
            />
        </Section>
    )
}
