import { VALIDATE_ALPHANUMERIC, VALIDATE_NUMERIC } from 'temptifly'
import {
    CREATE_CLOUD_CONNECTION,
    LOAD_CLOUD_CONNECTIONS,
    LOAD_OCP_IMAGES,
    networkingControlData,
    labelControlData,
} from './ControlDataHelpers'

// Ideally, we should use aws-sdk and the connection credentials to fetch this information,
// falling back to a pre-generated list if we can't connect.
// Generate list with the following script, then move us-* to the top
// Add in opt-in regions: af-south-1, ap-east-1, ap-northeast-3, me-south-1
/*
for region in `aws ec2 describe-regions --output json | jq -r '.Regions[].RegionName' | sort`
do
  echo -n "  '$region': "
  aws ec2 describe-availability-zones --region $region --output json | jq -c '[ .AvailabilityZones[].ZoneName ]' | sed -e "s/\"/'/g" -e 's/,/, /g' -e 's/]/],/g'
done
*/
export const regions = {
    'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f'],
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
}

const setAWSZones = (control, controlData) => {
    const setZones = (poolKey, zoneKey) => {
        const region = control.active
        const pool = controlData.find(({ id }) => id === poolKey)
        const typeZones = pool.active[0].find(({ id }) => id === zoneKey)
        const zones = regions[region]
        typeZones.available = zones || []
        typeZones.active = []
    }

    setZones('masterPool', 'masterZones')
    setZones('workerPools', 'workerZones')
}

const masterInstanceTypes = [
    { value: 'm5.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
    { value: 'm5.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
    { value: 'm5.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
    { value: 'm5.4xlarge', description: '16 vCPU, 64  GiB RAM - General Purpose' },
    { value: 'm5.10xlarge', description: '40 vCPU, 160 GiB RAM - General Purpose' },
    { value: 'm5.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
]

const workerInstanceTypes = [
    {
        label: 'General Purpose',
        children: [
            {
                label: 'Balanced',
                children: [
                    {
                        label: 'M4 - 2.3 GHz Intel processors',
                        children: [
                            { value: 'm4.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm4.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm4.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm4.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm4.10xlarge', description: '40 vCPU, 160 GiB RAM - General Purpose' },
                            { value: 'm4.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5 - 3.1 GHz Intel processors',
                        children: [
                            { value: 'm5.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5.4xlarge', description: '16 vCPU, 64  GiB RAM - General Purpose' },
                            { value: 'm5.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'm5.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5a - AMD processors, up to 10% cost savings over M5',
                        children: [
                            { value: 'm5a.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm5a.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5a.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5a.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm5a.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5a.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5a.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'm5a.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5n - Network optimized',
                        children: [
                            { value: 'm5n.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm5n.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5n.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5n.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm5n.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5n.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5n.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
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
                            { value: 't2.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 't2.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 't2.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
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
                            { value: 't3a.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 't3a.xlarge', description: '4 vCPU, 16  GiB RAM - General Purpose' },
                            { value: 't3a.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
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
                            { value: 'm5d.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm5d.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5d.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5d.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm5d.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5d.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5d.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
                            { value: 'm5d.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                            { value: 'm5d.metal', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5ad - AMD processor with SSDs physically connected to the host server',
                        children: [
                            { value: 'm5ad.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm5ad.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5ad.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5ad.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm5ad.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5ad.24xlarge', description: '96 vCPU, 384 GiB RAM - General Purpose' },
                        ],
                    },
                    {
                        label: 'M5dn - Network optimized with SSDs physically connected to the host server',
                        children: [
                            { value: 'm5dn.large', description: '2 vCPU, 8 GiB RAM - General Purpose' },
                            { value: 'm5dn.xlarge', description: '4 vCPU, 16 GiB RAM - General Purpose' },
                            { value: 'm5dn.2xlarge', description: '8 vCPU, 32 GiB RAM - General Purpose' },
                            { value: 'm5dn.4xlarge', description: '16 vCPU, 64 GiB RAM - General Purpose' },
                            { value: 'm5dn.8xlarge', description: '32 vCPU, 128 GiB RAM - General Purpose' },
                            { value: 'm5dn.12xlarge', description: '48 vCPU, 192 GiB RAM - General Purpose' },
                            { value: 'm5dn.16xlarge', description: '64 vCPU, 256 GiB RAM - General Purpose' },
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
                    { value: 'c5.24xlarge', description: '96 vCPU, 192 GiB RAM - Compute Optimized' },
                    { value: 'c5.metal', description: '96 vCPU, 192 GiB RAM - Compute Optimized' },
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
                    { value: 'c5a.24xlarge', description: '96 vCPU, 192 GiB RAM - Compute Optimized' },
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
                    { value: 'c5d.24xlarge', description: '96 vCPU, 192 GiB RAM - Compute Optimized' },
                    { value: 'c5d.metal', description: '96 vCPU, 192 GiB RAM - Compute Optimized' },
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
                            { value: 'r5.large', description: '2 vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'r5.xlarge', description: '4  vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5.2xlarge', description: '8 vCPU, 64 GiB RAM - Memory Optimized' },
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
                            { value: 'r5a.xlarge', description: '4 vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5a.2xlarge', description: '8  vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'r5a.4xlarge', description: '16 vCPU, 128 GiB RAM - Memory Optimized' },
                            { value: 'r5a.8xlarge', description: '32 vCPU, 256 GiB RAM - Memory Optimized' },
                            { value: 'r5a.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'r5a.16xlarge', description: '64 vCPU, 512 GiB RAM - Memory Optimized' },
                            { value: 'r5a.24xlarge', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'R5n - Network optimized',
                        children: [
                            { value: 'r5n.large', description: '2 vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'r5n.xlarge', description: '4 vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5n.2xlarge', description: '8 vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'r5n.4xlarge', description: '16 vCPU, 128 GiB RAM - Memory Optimized' },
                            { value: 'r5n.8xlarge', description: '32 vCPU, 256 GiB RAM - Memory Optimized' },
                            { value: 'r5n.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'r5n.16xlarge', description: '64 vCPU, 512 GiB RAM - Memory Optimized' },
                            { value: 'r5n.24xlarge', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
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
                            { value: 'r5d.4xlarge', description: '16 vCPU, 128 GiB RAM - Memory Optimized' },
                            { value: 'r5d.8xlarge', description: '32 vCPU, 256 GiB RAM - Memory Optimized' },
                            { value: 'r5d.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'r5d.16xlarge', description: '64 vCPU, 512 GiB RAM - Memory Optimized' },
                            { value: 'r5d.24xlarge', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
                            { value: 'r5d.metal', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'R5dn - With SSD, network optimized',
                        children: [
                            { value: 'r5dn.large', description: '2 vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.xlarge', description: '4  vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.2xlarge', description: '8 vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.4xlarge', description: '16 vCPU, 128 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.8xlarge', description: '32 vCPU, 256 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.16xlarge', description: '64 vCPU, 512 GiB RAM - Memory Optimized' },
                            { value: 'r5dn.24xlarge', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'R5ad - With SSD, AMD processors',
                        children: [
                            { value: 'r5ad.large', description: '2 vCPU, 16  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.xlarge', description: '4  vCPU, 32  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.2xlarge', description: '8 vCPU, 64  GiB RAM - Memory Optimized' },
                            { value: 'r5ad.4xlarge', description: '16 vCPU, 128 GiB RAM - Memory Optimized' },
                            { value: 'r5ad.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'r5ad.24xlarge', description: '96 vCPU, 768 GiB RAM - Memory Optimized' },
                        ],
                    },
                    {
                        label: 'Z1d - With SSD, fastest processor',
                        children: [
                            { value: 'z1d.large', description: '2  vCPU, 16 GiB RAM - Memory Optimized' },
                            { value: 'z1d.xlarge', description: '4 vCPU, 32 GiB RAM - Memory Optimized' },
                            { value: 'z1d.2xlarge', description: '8  vCPU, 64 GiB RAM - Memory Optimized' },
                            { value: 'z1d.3xlarge', description: '12 vCPU, 96 GiB RAM - Memory Optimized' },
                            { value: 'z1d.6xlarge', description: '24 vCPU, 192 GiB RAM - Memory Optimized' },
                            { value: 'z1d.12xlarge', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
                            { value: 'z1d.metal', description: '48 vCPU, 384 GiB RAM - Memory Optimized' },
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

const awsControlData = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
        name: 'cluster.create.ocp.image',
        tooltip: 'tooltip.cluster.create.ocp.image',
        id: 'imageSet',
        type: 'combobox',
        placeholder: 'creation.ocp.cloud.select.ocp.image',
        fetchAvailable: LOAD_OCP_IMAGES('aws'),
        validation: {
            notification: 'creation.ocp.cluster.must.select.ocp.image',
            required: true,
        },
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'connection',
        type: 'singleselect',
        placeholder: 'creation.ocp.cloud.select.connection',
        validation: {
            notification: 'creation.ocp.cluster.must.select.connection',
            required: true,
        },
        fetchAvailable: LOAD_CLOUD_CONNECTIONS('aws'),
        prompts: CREATE_CLOUD_CONNECTION,
    },
    ...labelControlData,

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  node(machine) pools  /////////////////////////////////////
    {
        id: 'nodes',
        type: 'section',
        title: 'creation.ocp.node.pools',
        info: 'creation.ocp.cluster.node.pool.info',
        overline: true,
        collapsable: true,
        collapsed: true,
    },
    ///////////////////////  region  /////////////////////////////////////
    {
        name: 'creation.ocp.region',
        tooltip: 'tooltip.creation.ocp.aws.region',
        id: 'region',
        type: 'combobox',
        active: 'us-east-1',
        available: Object.keys(regions),
        validation: VALIDATE_ALPHANUMERIC,
        cacheUserValueKey: 'create.cluster.region',
        onSelect: setAWSZones,
        reverse: 'ClusterDeployment[0].metadata.labels.region',
    },
    ///////////////////////  master pool  /////////////////////////////////////
    {
        id: 'masterPool',
        type: 'group',
        onlyOne: true, // no prompts
        controlData: [
            {
                id: 'masterPool',
                type: 'section',
                subtitle: 'creation.ocp.node.master.pool.title',
                info: 'creation.ocp.node.master.pool.info',
                collapsable: true,
                collapsed: true,
            },
            ///////////////////////  zone  /////////////////////////////////////
            {
                name: 'creation.ocp.zones',
                tooltip: 'tooltip.creation.ocp.master.zones',
                id: 'masterZones',
                type: 'multiselect',
                available: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f'],
                placeholder: 'creation.ocp.add.zones',
                cacheUserValueKey: 'create.cluster.aws.master.zones',
                validation: VALIDATE_ALPHANUMERIC,
                multiselect: true,
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.aws.instance.type',
                learnMore: 'https://aws.amazon.com/ec2/instance-types/',
                id: 'masterType',
                type: 'combobox',
                available: masterInstanceTypes,
                active: 'm5.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9.]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: false,
                },
                cacheUserValueKey: 'create.cluster.master.type',
            },
            ///////////////////////  root volume  /////////////////////////////////////
            {
                name: 'creation.ocp.root.storage',
                tooltip: 'tooltip.creation.ocp.aws.root.storage',
                id: 'masterRootStorage',
                type: 'combobox',
                active: '100',
                available: ['100', '300', '500', '800', '1000', '1200'],
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.master.root.storage',
            },
        ],
    },
    ///////////////////////  worker pools  /////////////////////////////////////
    {
        id: 'workerPools',
        type: 'group',
        prompts: {
            nameId: 'workerName',
            baseName: 'worker',
            addPrompt: 'creation.ocp.cluster.add.node.pool',
            deletePrompt: 'creation.ocp.cluster.delete.node.pool',
        },
        controlData: [
            {
                id: 'workerPool',
                type: 'section',
                subtitle: 'creation.ocp.node.worker.pool.title',
                info: 'creation.ocp.node.worker.pool.info',
                collapsable: true,
                collapsed: true,
            },
            ///////////////////////  pool name  /////////////////////////////////////
            {
                name: 'creation.ocp.pool.name',
                tooltip: 'tooltip.creation.ocp.pool.name',
                id: 'workerName',
                type: 'text',
                active: 'worker',
                validation: VALIDATE_ALPHANUMERIC,
            },
            ///////////////////////  zone  /////////////////////////////////////
            {
                name: 'creation.ocp.zones',
                tooltip: 'tooltip.creation.ocp.worker.zones',
                id: 'workerZones',
                type: 'multiselect',
                available: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f'],
                placeholder: 'creation.ocp.add.zones',
                cacheUserValueKey: 'create.cluster.aws.worker.zones',
                validation: VALIDATE_ALPHANUMERIC,
                multiselect: true,
            },
            ///////////////////////  instance type  /////////////////////////////////////
            {
                name: 'creation.ocp.instance.type',
                tooltip: 'tooltip.creation.ocp.aws.instance.type',
                learnMore: 'https://aws.amazon.com/ec2/instance-types/',
                id: 'workerType',
                type: 'treeselect',
                available: workerInstanceTypes,
                active: 'm5.xlarge',
                validation: {
                    constraint: '[A-Za-z0-9.]+',
                    notification: 'creation.ocp.cluster.valid.alphanumeric.period',
                    required: false,
                },
                cacheUserValueKey: 'create.cluster.worker.type',
            },
            ///////////////////////  compute node count  /////////////////////////////////////
            {
                name: 'creation.ocp.compute.node.count',
                tooltip: 'tooltip.creation.ocp.compute.node.count',
                id: 'computeNodeCount',
                type: 'number',
                initial: '3',
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.compute.node.count',
            },
            ///////////////////////  storage  /////////////////////////////////////
            {
                name: 'creation.ocp.root.storage',
                tooltip: 'tooltip.creation.ocp.aws.root.storage',
                id: 'workerStorage',
                type: 'combobox',
                active: '100',
                available: ['100', '300', '500', '800', '1000', '1200'],
                validation: VALIDATE_NUMERIC,
                cacheUserValueKey: 'create.cluster.persistent.storage',
            },
        ],
    },
    ...networkingControlData,
]

export default awsControlData
