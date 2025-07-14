/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line no-use-before-define
import { CodeBlock, Icon, List, ListItem, Stack } from '@patternfly/react-core'
import { CheckIcon, CloseIcon } from '@patternfly/react-icons'
import { useHistory } from 'react-router-dom'
import {
    Section,
    WizSelect,
    Step,
    WizardPage,
    WizArrayInput,
    WizCheckbox,
    WizDetailsHidden,
    WizItemSelector,
    WizMultiSelect,
    WizNumberInput,
    WizSingleSelect,
    WizTextDetail,
    WizTextInput,
} from '../../src'
import { IResource } from '../../src/common/resource'
import { Sync } from '../../src/Sync'
import { IHypershiftDeployment } from './IHypershiftDeployment'

const newNodePool = {
    name: '',
    spec: {
        clusterName: '',
        management: {
            upgradeType: 'InPlace',
        },
        platform: {
            type: 'AWS',
            aws: {
                instanceType: '',
            },
        },
        release: {
            image: '',
        },
    },
}

const defaultData: IHypershiftDeployment = {
    apiVersion: 'cluster.open-cluster-management.io/v1alpha1',
    kind: 'HypershiftDeployment',
    metadata: {
        name: '',
        namespace: '',
    },
    spec: {
        hostingCluster: '',
        hostingNamespace: '',
        infrastructure: {
            cloudProvider: {
                name: '',
            },
            configure: true,
            platform: {
                aws: {
                    region: '',
                },
            },
        },
        hostedClusterSpec: {
            dns: {
                baseDomain: '',
            },
            fips: true,
            networking: {
                machineCIDR: '',
                networkType: 'OpenShiftSDN', //'OpenShiftSDN' | 'Calico' | 'OVNKubernetes' | 'Other'
                podCIDR: '',
                serviceCIDR: '',
            },
            platform: { type: 'AWS' },
            pullSecret: {},
            release: { image: '' },
            services: [],
            sshKey: {},
        },
    },
}

interface AWSHypershiftWizardProps {
    clusterSets: IResource[]
}

export function AmazonHypershiftWizard(props: AWSHypershiftWizardProps) {
    const history = useHistory()
    const clusterSets = props.clusterSets.map((clusterSet) => clusterSet.metadata?.name) as string[]
    return (
        <WizardPage
            title="Create cluster"
            breadcrumb={[{ label: 'Managed clusters', to: '.' }]}
            onSubmit={() => Promise.resolve(undefined)}
            onCancel={() => history.push('./?route=wizards')}
            defaultData={[
                defaultData,
                {
                    apiVersion: 'v1',
                    kind: 'Secret',
                    metadata: {
                        name: 'hypershift-operator-oidc-provider-s3-credentials',
                        namespace: 'local-cluster',
                    },
                    type: 'Opaque',
                    data: {
                        credentials: '',
                    },
                    stringData: {
                        bucket: '',
                        region: '',
                    },
                },
            ]}
        >
            <Step label="Prerequsites" id="prerequsites">
                <Section label="Prerequsites" autohide={false}>
                    <WizDetailsHidden>
                        <Stack hasGutter>
                            <List>
                                <ListItem
                                    icon={
                                        <Icon status="success">
                                            <CheckIcon />
                                        </Icon>
                                    }
                                >
                                    <Stack style={{ width: '100%' }} hasGutter>
                                        <div>The hypershift-preview component is enabled on the multi-cluster engine.</div>
                                        <CodeBlock>{`oc get mce multiclusterengine-sample -ojsonpath="{.spec.overrides.components[?(@.name=='hypershift-preview')].enabled}"`}</CodeBlock>
                                    </Stack>
                                </ListItem>
                            </List>
                            <List>
                                <ListItem
                                    icon={
                                        <Icon status="success">
                                            <CheckIcon />
                                        </Icon>
                                    }
                                >
                                    <Stack style={{ width: '100%' }} hasGutter>
                                        <div>Managed cluster addon for hypershift is configured.</div>
                                        <CodeBlock>{`oc get mca hypershift-addon -n local-cluster`}</CodeBlock>
                                    </Stack>
                                </ListItem>
                            </List>
                            <List>
                                <ListItem
                                    icon={
                                        <Icon status="danger">
                                            <CloseIcon />
                                        </Icon>
                                    }
                                >
                                    <Stack style={{ width: '100%' }} hasGutter>
                                        <div>
                                            An OIDC s3 credentials secret for the HyperShift operator to use to access a public s3 bucket
                                        </div>
                                        <CodeBlock>{`oc get secret hypershift-operator-oidc-provider-s3-credentials -n local-cluster`}</CodeBlock>
                                        <div>
                                            See Getting started in the{' '}
                                            <a href="https://hypershift-docs.netlify.app/getting-started" target="_blank" rel="noreferrer">
                                                HyperShift
                                            </a>{' '}
                                            documentation for more information about the secret.
                                        </div>
                                        <CodeBlock>aws s3api create-bucket --acl public-read --bucket your-bucket-name</CodeBlock>

                                        <div>The following example shows how to create the secret:</div>
                                        <CodeBlock>{`oc create secret generic hypershift-operator-oidc-provider-s3-credentials --from-file=credentials=$HOME/.aws/credentials --from-literal=bucket=<your-bucket-name> --from-literal=region=<region> -n local-cluster`}</CodeBlock>
                                    </Stack>
                                </ListItem>
                            </List>
                        </Stack>
                    </WizDetailsHidden>
                </Section>
            </Step>
            <Step label="Cluster details" id="cluster-details">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section label="Cluster details" prompt="Enter the cluster details">
                        <Sync kind="HypershiftDeployment" path="metadata.name" targetPath="metadata.name" />
                        <WizTextInput
                            path="metadata.name"
                            label="Cluster name"
                            placeholder="Enter the cluster name"
                            required
                            labelHelp="The unique name of your cluster. The value must be a string that contains lowercase alphanumeric values, such as dev. Cannot be changed after creation."
                        />
                        <WizSelect
                            path="spec.hostingNamespace"
                            label="Cluster set"
                            placeholder="Select a cluster set"
                            labelHelp="A cluster set is a group of clusters that can be targeted as a group."
                            options={clusterSets}
                            required
                        />
                        <WizSelect
                            path="spec.infrastructure.release.image"
                            label="Release image"
                            placeholder="Select a release image"
                            options={['default']}
                            required
                        />
                        <WizCheckbox
                            path="spec.hostedClusterSpec.fips"
                            label="FIPS"
                            helperText="Use the Federal Information Processing Standards (FIPS) modules provided with Red Hat Enterprise Linux CoreOS instead of the default Kubernetes cryptography suite."
                        />
                    </Section>
                </WizItemSelector>
            </Step>

            <Step label="Credentials" id="credentials">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section label="Credentials">
                        <WizSingleSelect
                            path="spec.infrastructure.cloudProvider.name"
                            label="Infrastructure credentials"
                            placeholder="Select the credentials for the infrastructure"
                            options={['default']}
                            required
                        />
                        <WizTextInput
                            path="spec.hostedClusterSpec.dns.baseDomain"
                            label="Base DNS domain"
                            labelHelp="The base domain of your provider, which is used to create routes to your OpenShift Container Platform cluster components. It is configured in your cloud provider's DNS as a Start Of Authority record (SOA). Cannot be changed after creation."
                            placeholder="Enter the Base DNS domain"
                            helperText="Defaults to the base DNS domain from the credentials."
                        />
                        <WizSelect
                            path="spec.infrastructure.release.platform.image"
                            label="Release image"
                            placeholder="Select a release image"
                            options={['default']}
                        />
                        <WizCheckbox path="spec.hostedClusterSpec.fips" label="FIPS" />
                    </Section>
                </WizItemSelector>
            </Step>

            <Step label="Worker pools" id="worker-pools">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section
                        label="Worker pools"
                        prompt="Enter the worker pools"
                        description="One or more worker nodes will be created to run the container workloads in this cluster."
                    >
                        <WizSelect
                            path="spec.infrastructure.platform.aws.region"
                            label="Region"
                            options={Object.keys(awsRegions)}
                            required
                            labelHelp="The AWS region where the installation program creates your cluster resources. You can select zones within the region for your control plane and worker pools."
                        />
                        <WizMultiSelect path="spec.infrastructure.platform.aws.zones" label="Zones" options={awsRegions['us-east-1']} />
                        <WizArrayInput
                            path="spec.nodePools"
                            label="Worker pools"
                            placeholder="Add worker pool"
                            collapsedContent={<WizTextDetail path="name" placeholder="Expand to edit the worker pool details" />}
                            newValue={newNodePool}
                        >
                            <WizTextInput path="name" label="Pool name" required />
                            <WizSelect path="spec.platform.aws.instanceType" label="Instance type" options={['default']} required />
                        </WizArrayInput>
                    </Section>
                </WizItemSelector>
            </Step>

            <Step label="Autoscaling" id="autoscaling">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section label="Autoscaling">
                        <WizNumberInput
                            path="spec.hostedClusterSpec.autoscaling.maxNodesTotal"
                            label="Max nodes total"
                            labelHelp="MaxNodesTotal is the maximum allowable number of nodes across all NodePools for a HostedCluster. The autoscaler will not grow the cluster beyond this number."
                        />
                        <WizTextInput
                            path="spec.hostedClusterSpec.autoscaling.maxNodeProvisionTime"
                            label="Max node provision time"
                            labelHelp="MaxNodeProvisionTime is the maximum time to wait for node provisioning before considering the provisioning to be unsuccessful, expressed as a Go duration string. The default is 15 minutes."
                        />
                        <WizNumberInput
                            path="spec.hostedClusterSpec.autoscaling.maxPodGracePeriod"
                            label="Max pod grace period"
                            labelHelp="MaxPodGracePeriod is the maximum seconds to wait for graceful pod termination before scaling down a NodePool. The default is 600 seconds."
                            helperText="The period in seconds."
                        />
                        <WizNumberInput
                            path="spec.hostedClusterSpec.autoscaling.podPriorityThreshold"
                            label="Pod priority threshold"
                            labelHelp="PodPriorityThreshold enables users to schedule 'best-effort' pods, which shouldn't trigger autoscaler actions, but only run when there are spare resources available. The default is -10."
                            min={-9999}
                        />
                    </Section>
                </WizItemSelector>
            </Step>

            <Step label="Networking" id="networking">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section label="Networking" prompt="Enter networking options" description="Configure network access for your cluster.">
                        <WizSingleSelect
                            path="spec.hostedClusterSpec.networking.networkType"
                            label="Network type"
                            options={['OpenShiftSDN', 'OVNKubernetes']}
                            required
                        />
                        <WizTextInput path="spec.hostedClusterSpec.networking.podCIDR" label="Pod CIDR" required />
                        <WizTextInput path="spec.hostedClusterSpec.networking.serviceCIDR" label="Service CIDR" required />
                        <WizTextInput path="spec.hostedClusterSpec.networking.machineCIDR" label="Machine CIDR" required />
                    </Section>
                </WizItemSelector>
            </Step>
            {/* <Step label="Automation" id="automation">
                <WizItemSelector selectKey="kind" selectValue="HypershiftDeployment">
                    <Section
                        label="Automation"
                        prompt="Configure a Ansible automation"
                        description="Choose an automation job template to automatically run Ansible jobs at different stages of a cluster's life cycle. To use this feature, the Ansible Automation Platform Resource Operator must be installed."
                    >
                        <Select path="ansibleTemplate" label="Ansible Automation Template" options={['default']} />
                    </Section>
                </WizItemSelector>
            </Step> */}
        </WizardPage>
    )
}

export function ControlPlaneStep() {
    return (
        <Section
            label="Control plane"
            prompt="Enter the control plane details"
            description="Three control plane nodes will be created to control this cluster unless single node is enabled, in which case there will only be one control plane node."
        >
            <WizMultiSelect path="zones" label="Zones" options={awsRegions['us-east-1']} />
            <WizSelect
                path="instanceType"
                label="Instance type"
                placeholder="Select the instance type"
                options={AWSmasterInstanceTypes.map((instanceType) => ({ value: instanceType.value, label: instanceType.description }))}
                required
            />
            <WizSelect path="rootStorage" label="Root storage (GiB)" options={['default']} />
        </Section>
    )
}

// Ideally, we should use aws-sdk and the connection credentials to fetch this information,
// falling back to a pre-generated list if we can't connect.
// Generate list wita the following script, then move us-* to the top
// Add in opt-in regions: af-south-1, ap-east-1, ap-northeast-3, me-south-1
/*
for region in `aws ec2 describe-regions --output json | jq -r '.Regions[].RegionName' | sort`
do
  echo -n "  '$region': "
  aws ec2 describe-availability-zones --region $region --output json | jq -c '[ .AvailabilityZones[].ZoneName ]' | sed -e "s/\"/'/g" -e 's/,/, /g' -e 's/]/],/g'
done
*/
const usEast1a = 'us-east-1a'
const usEast1b = 'us-east-1b'
const usEast1c = 'us-east-1c'
const usEast1d = 'us-east-1d'
const usEast1e = 'us-east-1e'
const usEast1f = 'us-east-1f'
const gp2Cpu8Gib = '2 vCPU, 8 GiB RAM - General Purpose'
const gp4Cpu16Gib = '4 vCPU, 16 GiB RAM - General Purpose'
const gp8Cpu32Gib = '8 vCPU, 32 GiB RAM - General Purpose'
const gp16Cpu64Gib = '16 vCPU, 64 GiB RAM - General Purpose'
const gp40Cpu160Gib = '40 vCPU, 160 GiB RAM - General Purpose'
const gp64Cpu256Gib = '64 vCPU, 256 GiB RAM - General Purpose'
const co96Cpu192Gib = '96 vCPU, 192 GiB RAM - Compute Optimized'
const mo2Cpu16Gib = '2 vCPU, 16 GiB RAM - Memory Optimized'
const mo8Cpu64Gib = '8 vCPU, 64 GiB RAM - Memory Optimized'
const mo4Cpu64Gib = '4 vCPU, 32 GiB RAM - Memory Optimized'
const mo16Cpu64Gib = '16 vCPU, 128 GiB RAM - Memory Optimized'
const mo32Cpu64Gib = '32 vCPU, 256 GiB RAM - Memory Optimized'
const mo48Cpu64Gib = '48 vCPU, 384 GiB RAM - Memory Optimized'
const mo64Cpu64Gib = '64 vCPU, 512 GiB RAM - Memory Optimized'
const mo96Cpu64Gib = '96 vCPU, 768 GiB RAM - Memory Optimized'

export const awsRegions = {
    'us-east-1': [usEast1a, usEast1b, usEast1c, usEast1d, usEast1e, usEast1f],
    'us-east-2': ['us-east-2a', 'us-east-2b', 'us-east-2c'],
    'us-west-1': ['us-west-1a', 'us-west-1c'],
    'us-west-2': ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d'],
    'af-south-1': ['af-south-1a', 'af-south-1b', 'af-south-1c'],
    'ap-east-1': ['ap-east-1a', 'ap-east-1b', 'ap-east-1c'],
    'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
    'ap-northeast-2': ['ap-northeast-2a', 'ap-northeast-2b', 'ap-northeast-2c'],
    'ap-northeast-3': ['ap-northeast-3a'],
    'ap-south-1': ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'],
    'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
    'ap-southeast-2': ['ap-southeast-2a', 'ap-southeast-2b', 'ap-southeast-2c'],
    'ca-central-1': ['ca-central-1a', 'ca-central-1b', 'ca-central-1d'],
    'eu-central-1': ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'],
    'eu-north-1': ['eu-north-1a', 'eu-north-1b', 'eu-north-1c'],
    'eu-south-1': ['eu-south-1a', 'eu-south-1b', 'eu-south-1c'],
    'eu-west-1': ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
    'eu-west-2': ['eu-west-2a', 'eu-west-2b', 'eu-west-2c'],
    'eu-west-3': ['eu-west-3a', 'eu-west-3b', 'eu-west-3c'],
    'me-south-1': ['me-south-1a', 'me-south-1b', 'me-south-1c'],
    'sa-east-1': ['sa-east-1a', 'sa-east-1b', 'sa-east-1c'],
    'us-gov-west-1': ['us-gov-west-1a', 'us-gov-west-1b', 'us-gov-west-1c'],
    'us-gov-east-1': ['us-gov-east-1a', 'us-gov-east-1b', 'us-gov-east-1c'],
}

const AWSmasterInstanceTypes = [
    { value: 'm5.large', description: gp2Cpu8Gib },
    { value: 'm5.xlarge', description: gp4Cpu16Gib },
    { value: 'm5.2xlarge', description: gp8Cpu32Gib },
    { value: 'm5.4xlarge', description: gp16Cpu64Gib },
    { value: 'm5.10xlarge', description: gp40Cpu160Gib },
    { value: 'm5.16xlarge', description: gp64Cpu256Gib },
]

export const AWSworkerInstanceTypes = [
    {
        label: 'General Purpose',
        children: [
            {
                label: 'Balanced',
                children: [
                    {
                        label: 'M4 - 2.3 GHz Intel processors',
                        children: [
                            { value: 'm4.large', description: gp2Cpu8Gib },
                            { value: 'm4.xlarge', description: gp4Cpu16Gib },
                            { value: 'm4.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm4.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm4.10xlarge', description: gp40Cpu160Gib },
                            { value: 'm4.16xlarge', description: gp64Cpu256Gib },
                        ],
                    },
                    {
                        label: 'M5 - 3.1 GHz Intel processors',
                        children: [
                            { value: 'm5.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5.4xlarge', description: '16 vCPU, 64  GiB RAM - General Purpose' },
                            { value: 'm5.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5.16xlarge', description: gp64Cpu256Gib },
                            { value: 'm5.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5a - AMD processors, up to 10% cost savings over M5',
                        children: [
                            { value: 'm5a.large', description: gp2Cpu8Gib },
                            { value: 'm5a.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5a.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5a.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm5a.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5a.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5a.16xlarge', description: gp64Cpu256Gib },
                            { value: 'm5a.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5n - Network optimized',
                        children: [
                            { value: 'm5n.large', description: gp2Cpu8Gib },
                            { value: 'm5n.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5n.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5n.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm5n.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5n.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5n.16xlarge', description: gp64Cpu256Gib },
                            { value: 'm5n.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                ],
            },
            {
                label: 'Network Optimized',
                children: [
                    { value: 'a1.medium', description: '1 vCPU, 2 GiB RAM - Network Optimized' },
                    { value: 'a1.large', description: '2 vCPU, 4 GiB RAM - Network Optimized' },
                    { value: 'a1.xlarge', description: '4 vCPU, 8  GiB RAM - Network Optimized' },
                    { value: 'a1.2xlarge', description: '8 vCPU, 16 GiB RAM - Network Optimized' },
                    { value: 'a1.4xlarge', description: '16 vCPU, 32 GiB RAM - Network Optimized' },
                    { value: 'a1.metal', description: '16 vCPU, 32 GiB RAM - Network Optimized' },
                ],
            },
            {
                label: 'Burstable CPU',
                children: [
                    {
                        label: 'T2 - Lowest-cost',
                        children: [
                            { value: 't2.nano', description: '1 vCPU, 0.5 GiB RAM - General Purpose' },
                            { value: 't2.micro', description: '1 vCPU, 1 GiB RAM - General Purpose' },
                            { value: 't2.small', description: '1 vCPU, 2 GiB RAM - General Purpose' },
                            { value: 't2.medium', description: '2 vCPU, 4  GiB RAM - General Purpose' },
                            { value: 't2.large', description: gp2Cpu8Gib },
                            { value: 't2.xlarge', description: gp4Cpu16Gib },
                            { value: 't2.2xlarge', description: gp8Cpu32Gib },
                        ],
                    },
                    {
                        label: 'T3 - General purpose',
                        children: [
                            { value: 't3.nano', description: '2 vCPU, 0.5 GiB RAM - Burstable CPU' },
                            { value: 't3.micro', description: '2 vCPU, 1 GiB RAM - Burstable CPU' },
                            { value: 't3.small', description: '2 vCPU, 2  GiB RAM - Burstable CPU' },
                            { value: 't3.medium', description: '2 vCPU, 4 GiB RAM - Burstable CPU' },
                            { value: 't3.large', description: '2 vCPU, 8 GiB RAM - Burstable CPU' },
                            { value: 't3.xlarge', description: '4 vCPU, 16 GiB RAM - Burstable CPU' },
                            { value: 't3.2xlarge', description: '8 vCPU, 32 GiB RAM - Burstable CPU' },
                        ],
                    },
                    {
                        label: 'T3a - Up to 10% cost savings over T3',
                        children: [
                            { value: 't3a.nano', description: '2 vCPU, 0.5 GiB RAM - General Purpose' },
                            { value: 't3a.micro', description: '2 vCPU, 1 GiB RAM - General Purpose' },
                            { value: 't3a.small', description: '2 vCPU, 2 GiB RAM - General Purpose' },
                            { value: 't3a.medium', description: '2 vCPU, 4 GiB RAM - General Purpose' },
                            { value: 't3a.large', description: gp2Cpu8Gib },
                            { value: 't3a.xlarge', description: '4 vCPU, 16  GiB RAM - General Purpose' },
                            { value: 't3a.2xlarge', description: gp8Cpu32Gib },
                        ],
                    },
                ],
            },
            {
                label: 'With SSD',
                children: [
                    {
                        label: 'M5d - Intel processor with SSDs physically connected to the host server',
                        children: [
                            { value: 'm5d.large', description: gp2Cpu8Gib },
                            { value: 'm5d.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5d.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5d.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm5d.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5d.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5d.16xlarge', description: gp64Cpu256Gib },
                            { value: 'm5d.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                            { value: 'm5d.metal', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5ad - AMD processor with SSDs physically connected to the host server',
                        children: [
                            { value: 'm5ad.large', description: gp2Cpu8Gib },
                            { value: 'm5ad.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5ad.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5ad.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm5ad.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5ad.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5dn - Network optimized with SSDs physically connected to the host server',
                        children: [
                            { value: 'm5dn.large', description: gp2Cpu8Gib },
                            { value: 'm5dn.xlarge', description: gp4Cpu16Gib },
                            { value: 'm5dn.2xlarge', description: gp8Cpu32Gib },
                            { value: 'm5dn.4xlarge', description: gp16Cpu64Gib },
                            { value: 'm5dn.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5dn.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5dn.16xlarge', description: gp64Cpu256Gib },
                            { value: 'm5dn.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: 'Compute Optimized',
        children: [
            {
                label: 'C5 - Intel processors, compute optimized',
                children: [
                    { value: 'c5.large', description: '2 vCPU, 4 GiB RAM - Compute Optimized' },
                    { value: 'c5.xlarge', description: '4  vCPU, 8 GiB RAM - Compute Optimized' },
                    { value: 'c5.2xlarge', description: '8 vCPU, 16  GiB RAM - Compute Optimized' },
                    { value: 'c5.4xlarge', description: '16 vCPU, 32 GiB RAM - Compute Optimized' },
                    { value: 'c5.9xlarge', description: '36 vCPU, 72 GiB RAM - Compute Optimized' },
                    { value: 'c5.12xlarge', description: '48 vCPU, 96  GiB RAM - Compute Optimized' },
                    { value: 'c5.18xlarge', description: '72 vCPU, 144 GiB RAM - Compute Optimized' },
                    { value: 'c5.24xlarge', description: co96Cpu192Gib },
                    { value: 'c5.metal', description: co96Cpu192Gib },
                ],
            },
            {
                label: 'C5a - AMD processors, compute optimized',
                children: [
                    { value: 'c5a.large', description: '2 vCPU, 4  GiB RAM - Compute Optimized' },
                    { value: 'c5a.xlarge', description: '4 vCPU, 8 GiB RAM - Compute Optimized' },
                    { value: 'c5a.2xlarge', description: '8 vCPU, 16 GiB RAM - Compute Optimized' },
                    { value: 'c5a.4xlarge', description: '16 vCPU, 32  GiB RAM - Compute Optimized' },
                    { value: 'c5a.8xlarge', description: '32 vCPU, 64 GiB RAM - Compute Optimized' },
                    { value: 'c5a.12xlarge', description: '48 vCPU, 96 GiB RAM - Compute Optimized' },
                    { value: 'c5a.16xlarge', description: '64 vCPU, 128 GiB RAM - Compute Optimized' },
                    { value: 'c5a.24xlarge', description: co96Cpu192Gib },
                ],
            },
            {
                label: 'C5d - Intel processors with SSD',
                children: [
                    { value: 'c5d.large', description: '2  vCPU, 4 GiB RAM - Compute Optimized' },
                    { value: 'c5d.xlarge', description: '4 vCPU, 8 GiB RAM - Compute Optimized' },
                    { value: 'c5d.2xlarge', description: '8  vCPU, 16  GiB RAM - Compute Optimized' },
                    { value: 'c5d.4xlarge', description: '16 vCPU, 32  GiB RAM - Compute Optimized' },
                    { value: 'c5d.9xlarge', description: '36 vCPU, 72  GiB RAM - Compute Optimized' },
                    { value: 'c5d.12xlarge', description: '48 vCPU, 96 GiB RAM - Compute Optimized' },
                    { value: 'c5d.18xlarge', description: '72 vCPU, 144 GiB RAM - Compute Optimized' },
                    { value: 'c5d.24xlarge', description: co96Cpu192Gib },
                    { value: 'c5d.metal', description: co96Cpu192Gib },
                ],
            },
            {
                label: 'C5n  - Intel processors, optimized network',
                children: [
                    { value: 'c5n.large', description: '2 vCPU, 5.25 GiB RAM - Compute Optimized' },
                    { value: 'c5n.xlarge', description: '4 vCPU, 10.5 GiB RAM - Compute Optimized' },
                    { value: 'c5n.2xlarge', description: '8 vCPU, 21 GiB RAM - Compute Optimized' },
                    { value: 'c5n.4xlarge', description: '16 vCPU, 42  GiB RAM - Compute Optimized' },
                    { value: 'c5n.9xlarge', description: '36 vCPU, 96 GiB RAM - Compute Optimized' },
                    { value: 'c5n.18xlarge', description: '72 vCPU, 192 GiB RAM - Compute Optimized' },
                    { value: 'c5n.metal', description: '72 vCPU, 192 GiB RAM - Compute Optimized' },
                ],
            },
            {
                label: 'C4  - Intel processors, cost-effective',
                children: [
                    { value: 'c4.large', description: '2 vCPU, 3.75GiB RAM - Compute Optimized' },
                    { value: 'c4.xlarge', description: '4 vCPU, 7.5 GiB RAM - Compute Optimized' },
                    { value: 'c4.2xlarge', description: '8 vCPU, 15  GiB RAM - Compute Optimized' },
                    { value: 'c4.4xlarge', description: '16 vCPU, 30 GiB RAM - Compute Optimized' },
                    { value: 'c4.8xlarge', description: '36 vCPU, 60GiB RAM - Compute Optimized' },
                ],
            },
        ],
    },
    {
        label: 'Memory Optimized',
        children: [
            {
                label: 'General Purpose',
                children: [
                    {
                        label: 'R4 - Optimized for memory-intensive applications',
                        children: [
                            { value: 'r4.large', description: '2 vCPU, 15.25 GiB RAM - Memory Optimized' },
                            { value: 'r4.xlarge', description: '4  vCPU, 30.5 GiB RAM - Memory Optimized' },
                            { value: 'r4.2xlarge', description: '8 vCPU, 61 GiB RAM - Memory Optimized' },
                            { value: 'r4.4xlarge', description: '16 vCPU, 122 GiB RAM - Memory Optimized' },
                            { value: 'r4.8xlarge', description: '32 vCPU, 244 GiB RAM - Memory Optimized' },
                            { value: 'r4.16xlarge', description: '64 vCPU, 488 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'R5 - 5% additional memory per vCPU over R4',
                        children: [
                            { value: 'r5.large', description: mo2Cpu16Gib },
                            { value: 'r5.xlarge', description: '4  vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5.2xlarge', description: mo8Cpu64Gib },
                            { value: 'r5.4xlarge', description: '16 vCPU, 128GiB RAM - Memory Optimized' },
                            { value: 'r5.8xlarge', description: '32 vCPU, 256GiB RAM - Memory Optimized' },
                            { value: 'r5.12xlarge', description: '48 vCPU, 384GiB RAM - Memory Optimized' },
                            { value: 'r5.16xlarge', description: '64 vCPU, 512GiB RAM - Memory Optimized' },
                            { value: 'r5.24xlarge', description: '96 vCPU, 768GiB RAM - Memory Optimized' },
                            { value: 'r5.metal', description: '96 vCPU, 768GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'R5a - AMD processors',
                        children: [
                            { value: 'r5a.large', description: '2  vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'r5a.xlarge', description: mo4Cpu64Gib },
                            { value: 'r5a.2xlarge', description: '8  vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'r5a.4xlarge', description: mo16Cpu64Gib },
                            { value: 'r5a.8xlarge', description: mo32Cpu64Gib },
                            { value: 'r5a.12xlarge', description: mo48Cpu64Gib },
                            { value: 'r5a.16xlarge', description: mo64Cpu64Gib },
                            { value: 'r5a.24xlarge', description: mo96Cpu64Gib },
                        ],
                    },
                    {
                        label: 'R5n - Network optimized',
                        children: [
                            { value: 'r5n.large', description: mo2Cpu16Gib },
                            { value: 'r5n.xlarge', description: mo4Cpu64Gib },
                            { value: 'r5n.2xlarge', description: mo8Cpu64Gib },
                            { value: 'r5n.4xlarge', description: mo16Cpu64Gib },
                            { value: 'r5n.8xlarge', description: mo32Cpu64Gib },
                            { value: 'r5n.12xlarge', description: mo48Cpu64Gib },
                            { value: 'r5n.16xlarge', description: mo64Cpu64Gib },
                            { value: 'r5n.24xlarge', description: mo96Cpu64Gib },
                        ],
                    },
                    {
                        label: 'High Memory - Metal',
                        children: [
                            { value: 'u-6tb1.metal', description: '448 vCPU, 6144 GiB RAM - Memory Optimized' },
                            { value: 'u-9tb1.metal', description: '448 vCPU, 9216 GiB RAM - Memory Optimized' },
                            { value: 'u-12tb1.metal', description: '448 vCPU, 12288 GiB RAM - Memory Optimized' },
                            { value: 'u-18tb1.metal', description: '448 vCPU, 18432 GiB RAM - Memory Optimized' },
                            { value: 'u-24tb1.metal', description: '448 vCPU, 24576 GiB RAM - Memory Optimized' },
                        ],
                    },
                ],
            },
            {
                label: 'With Xeon Processors',
                children: [
                    {
                        label: 'X1 - Xeon processors',
                        children: [
                            { value: 'x1.16xlarge', description: '64 vCPU, 976 GiB RAM - Memory Optimized' },
                            { value: 'x1.32xlarge', description: '128 vCPU, 1,952 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'X1e - Xeon processors, in-memory database optimized',
                        children: [
                            { value: 'x1e.xlarge', description: '4 vCPU, 122 GiB RAM - Memory Optimized' },
                            { value: 'x1e.2xlarge', description: '8 vCPU, 244 GiB RAM - Memory Optimized' },
                            { value: 'x1e.4xlarge', description: '16 vCPU, 488 GiB RAM - Memory Optimized' },
                            { value: 'x1e.8xlarge', description: '32 vCPU, 976 GiB RAM - Memory Optimized' },
                            { value: 'x1e.16xlarge', description: '64 vCPU, 1,952 GiB RAM - Memory Optimized' },
                            { value: 'x1e.32xlarge', description: '128 vCPU, 3,904 GiB RAM - Memory Optimized' },
                        ],
                    },
                ],
            },
            {
                label: 'With SSD',
                children: [
                    {
                        label: 'R5d - With SSD',
                        children: [
                            { value: 'r5d.large', description: '2  vCPU, 16  GiB RAM - Memory Optimized' },
                            { value: 'r5d.xlarge', description: '4 vCPU, 32  GiB RAM - Memory Optimized' },
                            { value: 'r5d.2xlarge', description: '8  vCPU, 64  GiB RAM - Memory Optimized' },
                            { value: 'r5d.4xlarge', description: mo16Cpu64Gib },
                            { value: 'r5d.8xlarge', description: mo32Cpu64Gib },
                            { value: 'r5d.12xlarge', description: mo48Cpu64Gib },
                            { value: 'r5d.16xlarge', description: mo64Cpu64Gib },
                            { value: 'r5d.24xlarge', description: mo96Cpu64Gib },
                            { value: 'r5d.metal', description: mo96Cpu64Gib },
                        ],
                    },
                    {
                        label: 'R5dn - With SSD, network optimized',
                        children: [
                            { value: 'r5dn.large', description: mo2Cpu16Gib },
                            { value: 'r5dn.xlarge', description: '4  vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.2xlarge', description: mo8Cpu64Gib },
                            { value: 'r5dn.4xlarge', description: mo16Cpu64Gib },
                            { value: 'r5dn.8xlarge', description: mo32Cpu64Gib },
                            { value: 'r5dn.12xlarge', description: mo48Cpu64Gib },
                            { value: 'r5dn.16xlarge', description: mo64Cpu64Gib },
                            { value: 'r5dn.24xlarge', description: mo96Cpu64Gib },
                        ],
                    },
                    {
                        label: 'R5ad - With SSD, AMD processors',
                        children: [
                            { value: 'r5ad.large', description: '2 vCPU, 16  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.xlarge', description: '4  vCPU, 32  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.2xlarge', description: '8 vCPU, 64  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.4xlarge', description: mo16Cpu64Gib },
                            { value: 'r5ad.12xlarge', description: mo48Cpu64Gib },
                            { value: 'r5ad.24xlarge', description: mo96Cpu64Gib },
                        ],
                    },
                    {
                        label: 'Z1d - With SSD, fastest processor',
                        children: [
                            { value: 'z1d.large', description: '2  vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'z1d.xlarge', description: mo4Cpu64Gib },
                            { value: 'z1d.2xlarge', description: '8  vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'z1d.3xlarge', description: '12 vCPU, 96 GiB RAM - Memory Optimized' },
                            { value: 'z1d.6xlarge', description: '24 vCPU, 192 GiB RAM - Memory Optimized' },
                            { value: 'z1d.12xlarge', description: mo48Cpu64Gib },
                            { value: 'z1d.metal', description: mo48Cpu64Gib },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: 'Accelerated Computing',
        children: [
            {
                label: 'P3 - NVIDIA Tesla V100 GPUs',
                children: [
                    { value: 'p3.2xlarge', description: '1 GPUs, 8 vCPU, 61 GiB, 16 GPU GiB- Accelerated Computing' },
                    { value: 'p3.8xlarge', description: '4 GPUs, 32 vCPU, 244 GiB, 64 GPU GiB- Accelerated Computing' },
                    {
                        value: 'p3.16xlarge',
                        description: '8 GPUs, 64 vCPU, 488 GiB, 128 GPU GiB- Accelerated Computing',
                    },
                    {
                        value: 'p3dn.24xlarge',
                        description: '8 GPUs, 96 vCPU, 768 GiB, 256 GPU GiB- Accelerated Computing',
                    },
                ],
            },
            {
                label: 'P2 - NVIDIA K80 GPUs',
                children: [
                    { value: 'p2.xlarge', description: '1  GPUs, 4 vCPU, 61 GiB, 12 GPU GiB- Accelerated Computing' },
                    { value: 'p2.8xlarge', description: '8 GPUs, 32 vCPU, 488 GiB, 96 GPU GiB- Accelerated Computing' },
                    {
                        value: 'p2.16xlarge',
                        description: '16 GPUs, 64 vCPU, 732 GiB, 192 GPU GiB- Accelerated Computing',
                    },
                ],
            },
            {
                label: 'G4 - NVIDIA T4 Tensor Core GPUs',
                children: [
                    { value: 'g4dn.xlarge', description: '1 GPUs, 4 vCPU, 16 GiB, 16 GPU GiB- Accelerated Computing' },
                    { value: 'g4dn.2xlarge', description: '1 GPUs, 8 vCPU, 32 GiB, 16 GPU GiB- Accelerated Computing' },
                    {
                        value: 'g4dn.4xlarge',
                        description: '1 GPUs, 16 vCPU, 64 GiB, 16 GPU GiB- Accelerated Computing',
                    },
                    {
                        value: 'g4dn.8xlarge',
                        description: '1 GPUs, 32 vCPU, 128 GiB, 16 GPU GiB- Accelerated Computing',
                    },
                    {
                        value: 'g4dn.16xlarge',
                        description: '1 GPUs, 64 vCPU, 256 GiB, 16 GPU GiB- Accelerated Computing',
                    },
                    {
                        value: 'g4dn.12xlarge',
                        description: '4 GPUs, 48 vCPU, 192 GiB, 64 GPU GiB- Accelerated Computing',
                    },
                    {
                        value: 'g4dn.metal',
                        description: '8 GPUs, 96 vCPU, 384 GiB, 128 GPU GiB- Accelerated Computing',
                    },
                ],
            },
            {
                label: 'G3 - NVIDIA Tesla M60 GPUs',
                children: [
                    { value: 'g3s.xlarge', description: '1 GPUs, 4 vCPU, 30.5 GiB, 8 GPU GiB- Accelerated Computing' },
                    { value: 'g3.4xlarge', description: '1 GPUs, 16 vCPU, 122 GiB, 8 GPU GiB- Accelerated Computing' },
                    { value: 'g3.8xlarge', description: '2 GPUs, 32 vCPU, 244 GiB, 16 GPU GiB- Accelerated Computing' },
                    {
                        value: 'g3.16xlarge',
                        description: '4 GPUs, 64 vCPU, 488 GiB, 32 GPU GiB- Accelerated Computing',
                    },
                ],
            },
        ],
    },
    {
        label: 'Storage Optimized',
        children: [
            {
                label: 'I3 - High Frequency Intel Xeon Processors',
                children: [
                    { value: 'i3.large', description: '2 vCPU, 15.25 GiB RAM - Storage Optimized' },
                    { value: 'i3.xlarge', description: '4  vCPU, 30.5 GiB RAM - Storage Optimized' },
                    { value: 'i3.2xlarge', description: '8 vCPU, 61  GiB RAM - Storage Optimized' },
                    { value: 'i3.4xlarge', description: '16 vCPU, 122 GiB RAM - Storage Optimized' },
                    { value: 'i3.8xlarge', description: '32 vCPU, 244 GiB RAM - Storage Optimized' },
                    { value: 'i3.16xlarge', description: '64 vCPU, 488 GiB RAM - Storage Optimized' },
                    { value: 'i3.metal', description: '72 vCPU, 512GiB RAM - Storage Optimized' },
                ],
            },
            {
                label: 'I3en - Non-Volatile Memory Express SSD instance storage',
                children: [
                    { value: 'i3en.large', description: '2 vCPU, 16  GiB RAM - Storage Optimized' },
                    { value: 'i3en.xlarge', description: '4  vCPU, 32  GiB RAM - Storage Optimized' },
                    { value: 'i3en.2xlarge', description: '8 vCPU, 64  GiB RAM - Storage Optimized' },
                    { value: 'i3en.3xlarge', description: '12 vCPU, 96 GiB RAM - Storage Optimized' },
                    { value: 'i3en.6xlarge', description: '24 vCPU, 192 GiB RAM - Storage Optimized' },
                    { value: 'i3en.12xlarge', description: '48 vCPU, 384 GiB RAM - Storage Optimized' },
                    { value: 'i3en.24xlarge', description: '96 vCPU, 768 GiB RAM - Storage Optimized' },
                    { value: 'i3en.metal', description: '96 vCPU, 768 GiB RAM - Storage Optimized' },
                ],
            },
            {
                label: 'D2 - Up to 48 TB of HDD-based local storage',
                children: [
                    { value: 'd2.xlarge', description: '4 vCPU, 30.5 GiB RAM - Storage Optimized' },
                    { value: 'd2.2xlarge', description: '8 vCPU, 61 GiB RAM - Storage Optimized' },
                    { value: 'd2.4xlarge', description: '16 vCPU, 122 GiB RAM - Storage Optimized' },
                    { value: 'd2.8xlarge', description: '36 vCPU, 244 GiB RAM - Storage Optimized' },
                ],
            },
            {
                label: 'H1 - 16 TB of HDD-based local storage',
                children: [
                    { value: 'h1.2xlarge', description: '8 vCPU, 32  GiB RAM - Storage Optimized' },
                    { value: 'h1.4xlarge', description: '16 vCPU, 64 GiB RAM - Storage Optimized' },
                    { value: 'h1.8xlarge', description: '32 vCPU, 128 GiB RAM - Storage Optimized' },
                    { value: 'h1.16xlarge', description: '64 vCPU, 256 GiB RAM - Storage Optimized' },
                ],
            },
        ],
    },
]
