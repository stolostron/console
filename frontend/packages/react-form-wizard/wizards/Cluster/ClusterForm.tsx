/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line no-use-before-define
import { useHistory } from 'react-router-dom'
import {
    WizKeyValue,
    WizMultiSelect,
    Section,
    WizSelect,
    Step,
    WizTextDetail,
    Tile,
    WizTiles,
    WizardPage,
    WizArrayInput,
    WizCheckbox,
    WizTextInput,
} from '../../src'

export function ClusterForm() {
    const history = useHistory()
    return (
        <WizardPage
            title="Create cluster"
            // template={YamlTemplate}
            breadcrumb={[{ label: 'Managed clusters', to: '.' }]}
            onSubmit={() => Promise.resolve(undefined)}
            onCancel={() => history.push('./?route=wizards')}
        >
            <Step label="Infrastructure provider" id="infrastructure-provider">
                <Section label="Infrastructure provider" prompt="Select the infrastructure for the cluster">
                    <WizTiles path="provider" label="Cloud infrastructure providers">
                        <Tile id="aws" value="aws" label="Amazon Web Services" />
                        <Tile id="azr" value="azr" label="Microsoft Azure" />
                        <Tile id="gcp" value="gcp" label="Google Cloud Platform" />
                        <Tile id="ost" value="ost" label="Red Hat OpenStack Platform" />
                        <Tile id="vsp" value="vsp" label="VMWare vSphere" />
                        <Tile id="bare" value="bare" label="Bare metal" />
                    </WizTiles>
                    <WizTiles id="centrallyManagedCredentials" path="provider" label="Centrally managed">
                        <Tile id="onp" value="onp" label="On premise" />
                    </WizTiles>
                </Section>
                <Section label="Credentials" prompt="Select the infrastructure for the cluster" hidden={(item) => !item.provider}>
                    <WizSelect
                        path="credential"
                        label="Infrastructure credentials"
                        placeholder="Select the credentials for the infrastructure"
                        options={['default']}
                        required
                    />
                </Section>
            </Step>

            <Step label="Cluster details" id="cluster-details">
                <Section label="Cluster details" prompt="Enter the cluster details">
                    <WizTextInput path="name" label="Cluster name" placeholder="Enter the cluster name" required />
                    <WizSelect path="region" label="Region" options={Object.keys(awsRegions)} />
                    <WizSelect
                        path="clusterSet"
                        label="Cluster set"
                        placeholder="Select a cluster set"
                        helperText="A cluster sets is a group of clusters that can be targeted as a group."
                        options={['default']}
                        required
                    />
                    <WizTextInput path="baseDnsDomain" label="Base DNS domain" placeholder="Enter the Base DNS domain" />
                    <WizSelect
                        path="releaseImage"
                        label="Release image"
                        placeholder="Select a release image"
                        options={['default']}
                        required
                    />
                    <WizKeyValue path="labels" label="Additional labels" />
                </Section>
            </Step>

            <Step label="Control plane" id="control-plane">
                <ControlPlaneStep />
            </Step>

            <Step label="Worker pools" id="worker-pools">
                <WorkerPoolsStep />
            </Step>

            <Step label="Networking" id="networking">
                <Section
                    label="Networking"
                    prompt="Enter networking options"
                    description="Configure network access for your cluster. One network is created by default."
                >
                    <WizSelect path="networkType" label="Network type" options={['default']} required />

                    <WizArrayInput
                        path="networks"
                        label="Networks"
                        placeholder="Add network"
                        collapsedContent={<WizTextDetail path="clusterCidr" placeholder="Expand to edit the network" />}
                    >
                        <WizTextInput path="clusterCidr" label="Cluster network CIDR" />
                        <WizTextInput path="hostPrefix" label="Network host prefix" />
                        <WizTextInput path="serviceCidr" label="Service network Cidr" />
                        <WizTextInput path="machienCidr" label="Machine CIDR" />
                    </WizArrayInput>
                </Section>
            </Step>

            <Step label="Proxy" id="proxy">
                <Section
                    label="Proxy"
                    prompt="Configure a proxy"
                    description="Production environments can deny direct access to the Internet and instead have an HTTP or HTTPS proxy available. You can configure a new OpenShift Container Platform cluster to use a proxy by configuring the proxy settings."
                >
                    <WizCheckbox path="useProxy" label="Use proxy" />
                    <WizTextInput
                        path="httpProxy"
                        label="Http Proxy "
                        helperText="Requires this format: http://<username>:<pswd>@<ip>:<port>"
                        required
                        hidden={(item) => !item.useProxy}
                    />
                    <WizTextInput
                        path="httpsProxy"
                        label="Https Proxy"
                        helperText="Requires this format: https://<username>:<pswd>@<ip>:<port>"
                        required
                        hidden={(item) => !item.useProxy}
                    />
                    <WizTextInput
                        path="noProxy"
                        label="No Proxy"
                        helperText="By default, all cluster egress traffic is proxied, including calls to hosting cloud provider APIs. Add sites to No Proxy to bypass the proxy if necessary."
                        hidden={(item) => !item.useProxy}
                    />
                    <WizTextInput path="additionalTrustBundle" label="Additional Trust Bundle" hidden={(item) => !item.useProxy} />
                </Section>
            </Step>

            <Step label="Automation" id="automation">
                <Section
                    label="Automation"
                    prompt="Configure a Ansible automation"
                    description="Choose an automation job template to automatically run Ansible jobs at different stages of a cluster's life cycle. To use this feature, the Ansible Automation Platform Resource Operator must be installed."
                >
                    <WizSelect path="ansibleTemplate" label="Ansible Automation Template" options={['default']} />
                </Section>
            </Step>
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

export function WorkerPoolsStep() {
    return (
        <Section
            label="Worker pools"
            prompt="Enter the worker pools"
            description="One or more worker nodes will be created to run the container workloads in this cluster."
        >
            <WizArrayInput
                path="workerPools"
                label="Worker pools"
                placeholder="Add worker pool"
                collapsedContent={<WizTextDetail path="name" placeholder="Expand to edit the worker pool details" />}
            >
                <WizTextInput path="name" label="Pool name" />
                <WizSelect path="zones" label="Zones" options={['default']} />
                <WizSelect path="instanceType" label="Instance type" options={['default']} />
                {/* <NumberInput */}
                <WizSelect path="rootStorage" label="Root storage (GiB)" options={['default']} />
            </WizArrayInput>
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
