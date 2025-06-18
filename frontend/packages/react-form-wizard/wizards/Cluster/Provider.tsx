import { Icon, Stack } from '@patternfly/react-core'
import { ServerIcon, VirtualMachineIcon } from '@patternfly/react-icons'
import { useHistory } from 'react-router-dom'
import {
    WizHidden,
    ItemContext,
    WizNumberInput,
    Section,
    WizSelect,
    WizSingleSelect,
    Step,
    WizSwitch,
    WizTableSelect,
    WizTextDetail,
    WizardPage,
    WizArrayInput,
    WizTextInput,
} from '../../src'
import { Catalog } from '../Catalog'
import { RouteE } from '../Routes'
import ALIBABA from './icons/alibaba.svg'
import AWS from './icons/aws.svg'
import AZURE from './icons/azure.svg'
import GOOGLE from './icons/google-cloud.svg'

export function ProviderCatalog() {
    const history = useHistory()
    return (
        <Catalog
            title="Provider"
            breadcrumbs={[{ label: 'Provider' }]}
            cards={[
                {
                    icon: <ALIBABA />,
                    title: 'ALIBABA',
                    descriptions: ['Create and manage your clusters through ALIBABA cloud.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['Standalone'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
                {
                    icon: <AWS />,
                    title: 'Amazon Web Services',
                    descriptions: ['Create and manage your clusters through Amazon cloud.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['Hosted', 'Standalone', 'Managed'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
                {
                    icon: (
                        <Icon size="lg">
                            <ServerIcon />
                        </Icon>
                    ),
                    title: 'Bare Metal',
                    descriptions: ['Create and manage your clusters on your bare metal machines.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['Hosted', 'Standalone'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
                {
                    icon: <GOOGLE />,
                    title: 'Google Cloud',
                    descriptions: ['Create and manage your clusters through Google cloud.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['Standalone'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
                {
                    icon: <AZURE />,
                    title: 'Microsoft Azure',
                    descriptions: ['Create and manage your clusters through Azure cloud.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['Standalone', 'Managed'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
                {
                    icon: (
                        <Icon size="lg">
                            <VirtualMachineIcon />
                        </Icon>
                    ),
                    title: 'VIRT',
                    descriptions: ['Create and manage your clusters on virtual machines.'],
                    featureGroups: [{ title: 'Available Control Planes', features: ['VSphere', 'RHV', 'OpenStack'] }],
                    onClick: () => history.push(RouteE.ControlPlane),
                },
            ]}
        />
    )
}

export function ControlPlaneCatalog() {
    const history = useHistory()
    return (
        <Catalog
            title="Control Plane Type"
            breadcrumbs={[{ label: 'Provider', to: RouteE.Provider }, { label: 'Control plane' }]}
            cards={[
                {
                    title: 'Hosted',
                    descriptions: [
                        'Run OpenShift in a hyperscale manner with many control planes hosted on a central hosting service cluster.',
                    ],
                    featureGroups: [
                        {
                            title: 'Features',
                            features: [
                                'Lower cost clusters',
                                'Network and trust segment between control planes and workers',
                                'Rapid cluster creation',
                            ],
                        },
                        {
                            title: 'Available cluster types',
                            features: ['Hosted cluster'],
                        },
                    ],
                    onClick: () => history.push(RouteE.CreateCluster),
                },
                {
                    title: 'Standalone',
                    descriptions: ['Run an OpenShift cluster with dedicated control plane nodes.'],
                    featureGroups: [
                        {
                            title: 'Features',
                            features: [
                                'Increase resiliency with mulitple masters',
                                'Isolateion of workload creates secure profile',
                                'Dedicated control plane nodes',
                            ],
                        },
                        {
                            title: 'Available cluster types',
                            features: ['ACM Hub', 'Hosting service cluster'],
                        },
                    ],
                },
            ]}
            onBack={() => history.push(RouteE.Provider)}
        />
    )
}

export function HostsCatalog() {
    const history = useHistory()
    return (
        <Catalog
            title="Hosts"
            breadcrumbs={[{ label: 'Provider', to: RouteE.Provider }, { label: 'Control plane' }]}
            cards={[
                {
                    title: 'Use existing hosts',
                    descriptions: [
                        'Create a cluster from hosts that have been discoverred and made available via infrstructure environments.',
                    ],
                },
                {
                    title: 'Discover new hosts',
                    descriptions: [
                        'Discover new hosts when creating the cluster without prior need to create on infrstructure environment.',
                    ],
                },
                {
                    title: 'IPI existing?',
                },
            ]}
            onBack={() => history.push(RouteE.Provider)}
        />
    )
}

export function CreateCluster() {
    const history = useHistory()
    return (
        <WizardPage
            title="Create cluster"
            breadcrumb={[
                { label: 'Provider', to: RouteE.Provider },
                { label: 'Control plane', to: RouteE.ControlPlane },
                { label: 'Create cluster' },
            ]}
            onSubmit={() => Promise.resolve(undefined)}
            onCancel={() => history.push(RouteE.ControlPlane)}
            defaultData={{ clusterSet: 'default', hostingCluster: 'local-cluster' }}
        >
            <Step label="Details" id="cluster-details-step">
                <Section label="Cluster Details">
                    <WizTextInput label="Name" path="name" required />
                    <WizSingleSelect
                        label="Cluster set"
                        path="clusterSet"
                        options={['default', 'cluster-set-1']}
                        helperText="A cluster set enables grouping of clusters and access control for those clusters."
                        required
                    />
                </Section>
            </Step>

            <Step label="Hosts" id="work-pools-step">
                <Section label="Control plane location">
                    <WizSingleSelect
                        label="Cluster"
                        path="hostingCluster"
                        options={['local-cluster']}
                        required
                        helperText="By default, the local-cluster will be selected as the hosting service cluster in order to run OpenShift in a hyperscale maneer with many control planes hosted on a central hosting service cluster."
                    />
                </Section>
                <WizArrayInput
                    path="workerPools"
                    helperText="Worker pools are created from infrastructure environment hosts."
                    label="Worker pools"
                    placeholder="Add worker pool"
                    collapsedContent={
                        <ItemContext.Consumer>
                            {(item) => {
                                const typedItem = item as { name: string; hosts: string }
                                return (
                                    <Stack hasGutter>
                                        <WizTextDetail path="name" placeholder="Expand to edit the worker pool details" />
                                        {typedItem.name && (typedItem.hosts?.length ?? 0) > 0 && (
                                            <div>
                                                <small>{typedItem.hosts?.length} worker nodes</small>
                                            </div>
                                        )}
                                    </Stack>
                                )
                            }}
                        </ItemContext.Consumer>
                    }
                    expandedContent={<div>Enter worker pool details</div>}
                    isSection
                    newValue={{ numberOfHosts: 1 }}
                >
                    <WizTextInput path="name" label="Worker pool name" required />
                    <WizSingleSelect label="Infrastructure environment" path="infraEnv" options={['infrastructure-1']} required />
                    <WizHidden hidden={(item) => !item.infraEnv}>
                        <WizSwitch path="auto" label="Auto select hosts" />
                        <WizNumberInput label="Number of hosts" path="numberOfHosts" min={1} hidden={(item) => !item.auto} />
                        <WizTableSelect
                            label="Infrastructure hosts"
                            path="hosts"
                            columns={[
                                { name: 'Name', cellFn: (item) => item.name },
                                { name: 'Status', cellFn: (item) => item.status },
                                { name: 'Cores', cellFn: (item) => item.cores },
                                { name: 'Memory', cellFn: (item) => item.memory },
                                { name: 'Storage', cellFn: (item) => item.storage },
                            ]}
                            items={new Array(16).fill(0).map((_, i) => ({
                                name: `host-${i.toString().padStart(4, '0')}`,
                                status: 'Ready',
                                cores: '8',
                                memory: '16 GB',
                                storage: '128 GB',
                            }))}
                            itemToValue={(item: unknown) => (item as any).name}
                            valueMatchesItem={(value: unknown, item: { name: string }) => value === item.name}
                            emptyTitle="Nothing available for selection."
                            emptyMessage="Nothing available for selection."
                            hidden={(item) => item.auto}
                        />
                    </WizHidden>
                </WizArrayInput>
            </Step>

            <Step label="Automation" id="automation-step">
                <Section
                    label="Automation"
                    description="Choose an automation job template to automatically run Ansible jobs at differrent stages of a clusters life cycle. To use this feature the Ansible Automation Platform Resource Operator must be installed."
                >
                    <WizSelect
                        label="Ansible automation template"
                        path="ansibleAutomationtemplate"
                        options={['my-ansible-template-1', 'my-ansible-template-2']}
                        placeholder="Select the Ansible automation template"
                    />
                </Section>
            </Step>

            {/* <Step label="Networking" id="networking">
                <Section
                    label="Networking"
                    prompt="Enter networking options"
                    description="Configure network access for your cluster. One network is created by default."
                >
                    <Select path="networkType" label="Network type" options={['default']} required />

                    <ArrayInput
                        path="networks"
                        label="Networks"
                        placeholder="Add network"
                        collapsedContent={<TextDetail path="clusterCidr" placeholder="Expand to edit the network" />}
                    >
                        <TextInput path="clusterCidr" label="Cluster network CIDR" />
                        <TextInput path="hostPrefix" label="Network host prefix" />
                        <TextInput path="serviceCidr" label="Service network Cidr" />
                        <TextInput path="machienCidr" label="Machine CIDR" />
                    </ArrayInput>
                </Section>
            </Step> */}

            {/* <Step label="Proxy" id="proxy">
                <Section
                    label="Proxy"
                    prompt="Configure a proxy"
                    description="Production environments can deny direct access to the Internet and instead have an HTTP or HTTPS proxy available. You can configure a new OpenShift Container Platform cluster to use a proxy by configuring the proxy settings."
                >
                    <Checkbox path="useProxy" label="Use proxy" />
                    <TextInput
                        path="httpProxy"
                        label="Http Proxy "
                        helperText="Requires this format: http://<username>:<pswd>@<ip>:<port>"
                        required
                        hidden={(item) => !item.useProxy}
                    />
                    <TextInput
                        path="httpsProxy"
                        label="Https Proxy"
                        helperText="Requires this format: https://<username>:<pswd>@<ip>:<port>"
                        required
                        hidden={(item) => !item.useProxy}
                    />
                    <TextInput
                        path="noProxy"
                        label="No Proxy"
                        helperText="By default, all cluster egress traffic is proxied, including calls to hosting cloud provider APIs. Add sites to No Proxy to bypass the proxy if necessary."
                        hidden={(item) => !item.useProxy}
                    />
                    <TextInput path="additionalTrustBundle" label="Additional Trust Bundle" hidden={(item) => !item.useProxy} />
                </Section>
            </Step> */}
        </WizardPage>
    )
}
