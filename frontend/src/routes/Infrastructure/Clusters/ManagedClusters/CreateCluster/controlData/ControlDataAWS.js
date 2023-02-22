/* Copyright Contributors to the Open Cluster Management project */
import {
  LOAD_OCP_IMAGES,
  addSnoText,
  appendKlusterletAddonConfig,
  architectureData,
  automationControlData,
  clusterDetailsControlData,
  getSimplifiedImageName,
  getWorkerName,
  isHidden_SNO,
  isHidden_lt_OCP48,
  networkingControlData,
  onChangeConnection,
  onChangeSNO,
  onImageChange,
  proxyControlData,
  disabledForFirstInGroup,
  reverseImageSet,
} from './ControlDataHelpers'
import {
  getAlphanumericValidator,
  getAlphanumericWithPeriodValidator,
  getNumericValidator,
  getHttpsURLValidator,
} from '../../../../../../components/TemplateEditor'

import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import Handlebars from 'handlebars'
import { getControlByID } from '../../../../../../lib/temptifly-utils'
import installConfigHbs from '../templates/install-config.hbs'

const installConfig = Handlebars.compile(installConfigHbs)

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
const usEast1a = 'us-east-1a'
const usEast1b = 'us-east-1b'
const usEast1c = 'us-east-1c'
const usEast1d = 'us-east-1d'
const usEast1e = 'us-east-1e'
const usEast1f = 'us-east-1f'

export let awsRegions = {
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
}

export const awsGovRegions = {
  'us-gov-west-1': ['us-gov-west-1a', 'us-gov-west-1b', 'us-gov-west-1c'],
  'us-gov-east-1': ['us-gov-east-1a', 'us-gov-east-1b', 'us-gov-east-1c'],
}

const setAWSZones = (control, controlData) => {
  const setZones = (poolKey, zoneKey) => {
    const region = control.active
    const pool = getControlByID(controlData, poolKey)
    pool.active.forEach((worker) => {
      const typeZones = worker.find(({ id }) => id === zoneKey)
      const zones = awsRegions[region]
      typeZones.available = zones || []
      typeZones.active = []
    })
  }

  setZones('masterPool', 'masterZones')
  setZones('workerPools', 'workerZones')
}

const updateWorkerZones = (control, controlData) => {
  const region = getControlByID(controlData, 'region').active
  const worker = control.active[control.active.length - 1]
  const typeZones = worker.find(({ id }) => id === 'workerZones')
  const zones = awsRegions[region]
  typeZones.available = zones || []
  typeZones.active = []
}

const AWSmasterInstanceTypes = (t) => {
  return [
    { value: 'm5.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
    { value: 'm5.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
    { value: 'm5.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
    { value: 'm5.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
    { value: 'm5.10xlarge', description: t('40 vCPU, 160 GiB RAM - General Purpose') },
    { value: 'm5.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
  ]
}

const onChangeAWSPrivate = (control, controlData) => {
  const awsPrivateFields = []
  const awsPrivateSections = []

  controlData.forEach((controlItem) => {
    const id = controlItem.id
    if (id === 'amiID' || id === 'hostedZone') awsPrivateFields.push(controlItem)
    if (id === 'privateLink' || id === 'serviceEndpoints') awsPrivateSections.push(controlItem)
  })

  awsPrivateFields.forEach((controlItem) => {
    controlItem.disabled = !controlItem.disabled
    if (controlItem.id === 'privateLinkCheckbox') {
      controlItem.active = control.active
    } else {
      controlItem.active = ''
    }
  })
  awsPrivateSections.forEach((controlItem) => {
    controlItem.active.forEach((section) => {
      section.forEach((item) => {
        if (item.controlId === 'subnetID') {
          item.active = []
        }
        if (item.id === 'endpointName') {
          controlItem.active.length = 1
          item.active = ''
        }
        if (item.id === 'endpointURL') {
          item.active = ''
        }
      })
    })
    controlItem.hidden = !controlItem.hidden
  })
}

export const AWSworkerInstanceTypes = (t) => {
  return [
    {
      label: t('General Purpose'),
      children: [
        {
          label: t('Balanced'),
          children: [
            {
              label: t('M4 - 2.3 GHz Intel processors'),
              children: [
                { value: 'm4.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm4.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm4.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm4.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm4.10xlarge', description: t('40 vCPU, 160 GiB RAM - General Purpose') },
                { value: 'm4.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('M5 - 3.1 GHz Intel processors'),
              children: [
                { value: 'm5.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5.8xlarge', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'm5.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'm5.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('M5a - AMD processors, up to 10% cost savings over M5'),
              children: [
                { value: 'm5a.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm5a.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5a.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5a.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5a.8xlarge', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'm5a.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5a.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'm5a.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('M5n - Network optimized'),
              children: [
                { value: 'm5n.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm5n.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5n.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5n.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5n.8xlarge', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'm5n.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5n.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'm5n.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
          ],
        },
        {
          label: t('Network Optimized'),
          children: [
            { value: 'a1.medium', description: t('1 vCPU, 2 GiB RAM - Network Optimized') },
            { value: 'a1.large', description: t('2 vCPU, 4 GiB RAM - Network Optimized') },
            { value: 'a1.xlarge', description: t('4 vCPU, 8 GiB RAM - Network Optimized') },
            { value: 'a1.2xlarge', description: t('8 vCPU, 16 GiB RAM - Network Optimized') },
            { value: 'a1.4xlarge', description: t('16 vCPU, 32 GiB RAM - Network Optimized') },
            { value: 'a1.metal', description: t('16 vCPU, 32 GiB RAM - Network Optimized') },
          ],
        },
        {
          label: t('Burstable CPU'),
          children: [
            {
              label: t('T2 - Lowest-cost'),
              children: [
                { value: 't2.nano', description: t('1 vCPU, 0.5 GiB RAM - General Purpose') },
                { value: 't2.micro', description: t('1 vCPU, 1 GiB RAM - General Purpose') },
                { value: 't2.small', description: t('1 vCPU, 2 GiB RAM - General Purpose') },
                { value: 't2.medium', description: t('2 vCPU, 4 GiB RAM - General Purpose') },
                { value: 't2.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 't2.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 't2.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('T3 - General purpose'),
              children: [
                { value: 't3.nano', description: t('2 vCPU, 0.5 GiB RAM - Burstable CPU') },
                { value: 't3.micro', description: t('2 vCPU, 1 GiB RAM - Burstable CPU') },
                { value: 't3.small', description: t('2 vCPU, 2 GiB RAM - Burstable CPU') },
                { value: 't3.medium', description: t('2 vCPU, 4 GiB RAM - Burstable CPU') },
                { value: 't3.large', description: t('2 vCPU, 8 GiB RAM - Burstable CPU') },
                { value: 't3.xlarge', description: t('4 vCPU, 16 GiB RAM - Burstable CPU') },
                { value: 't3.2xlarge', description: t('8 vCPU, 32 GiB RAM - Burstable CPU') },
              ],
            },
            {
              label: t('T3a - Up to 10% cost savings over T3'),
              children: [
                { value: 't3a.nano', description: t('2 vCPU, 0.5 GiB RAM - General Purpose') },
                { value: 't3a.micro', description: t('2 vCPU, 1 GiB RAM - General Purpose') },
                { value: 't3a.small', description: t('2 vCPU, 2 GiB RAM - General Purpose') },
                { value: 't3a.medium', description: t('2 vCPU, 4 GiB RAM - General Purpose') },
                { value: 't3a.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 't3a.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 't3a.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
              ],
            },
          ],
        },
        {
          label: t('With SSD'),
          children: [
            {
              label: t('M5d - Intel processor with SSDs physically connected to the host server'),
              children: [
                { value: 'm5d.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm5d.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5d.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5d.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5d.8xlarge', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'm5d.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5d.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'm5d.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
                { value: 'm5d.metal', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('M5ad - AMD processor with SSDs physically connected to the host server'),
              children: [
                { value: 'm5ad.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm5ad.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5ad.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5ad.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5ad.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5ad.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('M5dn - Network optimized with SSDs physically connected to the host server'),
              children: [
                { value: 'm5dn.large', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'm5dn.xlarge', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'm5dn.2xlarge', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'm5dn.4xlarge', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'm5dn.8xlarge', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'm5dn.12xlarge', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'm5dn.16xlarge', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'm5dn.24xlarge', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
              ],
            },
          ],
        },
      ],
    },
    {
      label: t('Compute Optimized'),
      children: [
        {
          label: t('C5 - Intel processors, compute optimized'),
          children: [
            { value: 'c5.large', description: t('2 vCPU, 4 GiB RAM - Compute Optimized') },
            { value: 'c5.xlarge', description: t('4 vCPU, 8 GiB RAM - Compute Optimized') },
            { value: 'c5.2xlarge', description: t('8 vCPU, 16 GiB RAM - Compute Optimized') },
            { value: 'c5.4xlarge', description: t('16 vCPU, 32 GiB RAM - Compute Optimized') },
            { value: 'c5.9xlarge', description: t('36 vCPU, 72 GiB RAM - Compute Optimized') },
            { value: 'c5.12xlarge', description: t('48 vCPU, 96 GiB RAM - Compute Optimized') },
            { value: 'c5.18xlarge', description: t('72 vCPU, 144 GiB RAM - Compute Optimized') },
            { value: 'c5.24xlarge', description: t('96 vCPU, 192 GiB RAM - Compute Optimized') },
            { value: 'c5.metal', description: t('96 vCPU, 192 GiB RAM - Compute Optimized') },
          ],
        },
        {
          label: t('C5a - AMD processors, compute optimized'),
          children: [
            { value: 'c5a.large', description: t('2 vCPU, 4 GiB RAM - Compute Optimized') },
            { value: 'c5a.xlarge', description: t('4 vCPU, 8 GiB RAM - Compute Optimized') },
            { value: 'c5a.2xlarge', description: t('8 vCPU, 16 GiB RAM - Compute Optimized') },
            { value: 'c5a.4xlarge', description: t('16 vCPU, 32 GiB RAM - Compute Optimized') },
            { value: 'c5a.8xlarge', description: t('32 vCPU, 64 GiB RAM - Compute Optimized') },
            { value: 'c5a.12xlarge', description: t('48 vCPU, 96 GiB RAM - Compute Optimized') },
            { value: 'c5a.16xlarge', description: t('64 vCPU, 128 GiB RAM - Compute Optimized') },
            { value: 'c5a.24xlarge', description: t('96 vCPU, 192 GiB RAM - Compute Optimized') },
          ],
        },
        {
          label: t('C5d - Intel processors with SSD'),
          children: [
            { value: 'c5d.large', description: t('2 vCPU, 4 GiB RAM - Compute Optimized') },
            { value: 'c5d.xlarge', description: t('4 vCPU, 8 GiB RAM - Compute Optimized') },
            { value: 'c5d.2xlarge', description: t('8 vCPU, 16 GiB RAM - Compute Optimized') },
            { value: 'c5d.4xlarge', description: t('16 vCPU, 32 GiB RAM - Compute Optimized') },
            { value: 'c5d.9xlarge', description: t('36 vCPU, 72 GiB RAM - Compute Optimized') },
            { value: 'c5d.12xlarge', description: t('48 vCPU, 96 GiB RAM - Compute Optimized') },
            { value: 'c5d.18xlarge', description: t('72 vCPU, 144 GiB RAM - Compute Optimized') },
            { value: 'c5d.24xlarge', description: t('96 vCPU, 192 GiB RAM - Compute Optimized') },
            { value: 'c5d.metal', description: t('96 vCPU, 192 GiB RAM - Compute Optimized') },
          ],
        },
        {
          label: t('C5n - Intel processors, optimized network'),
          children: [
            { value: 'c5n.large', description: t('2 vCPU, 5.25 GiB RAM - Compute Optimized') },
            { value: 'c5n.xlarge', description: t('4 vCPU, 10.5 GiB RAM - Compute Optimized') },
            { value: 'c5n.2xlarge', description: t('8 vCPU, 21 GiB RAM - Compute Optimized') },
            { value: 'c5n.4xlarge', description: t('16 vCPU, 42 GiB RAM - Compute Optimized') },
            { value: 'c5n.9xlarge', description: t('36 vCPU, 96 GiB RAM - Compute Optimized') },
            { value: 'c5n.18xlarge', description: t('72 vCPU, 192 GiB RAM - Compute Optimized') },
            { value: 'c5n.metal', description: t('72 vCPU, 192 GiB RAM - Compute Optimized') },
          ],
        },
        {
          label: t('C4  - Intel processors, cost-effective'),
          children: [
            { value: 'c4.large', description: t('2 vCPU, 3.75GiB RAM - Compute Optimized') },
            { value: 'c4.xlarge', description: t('4 vCPU, 7.5 GiB RAM - Compute Optimized') },
            { value: 'c4.2xlarge', description: t('8 vCPU, 15 GiB RAM - Compute Optimized') },
            { value: 'c4.4xlarge', description: t('16 vCPU, 30 GiB RAM - Compute Optimized') },
            { value: 'c4.8xlarge', description: t('36 vCPU, 60GiB RAM - Compute Optimized') },
          ],
        },
      ],
    },
    {
      label: t('Memory Optimized'),
      children: [
        {
          label: t('General Purpose'),
          children: [
            {
              label: t('R4 - Optimized for memory-intensive applications'),
              children: [
                { value: 'r4.large', description: t('2 vCPU, 15.25 GiB RAM - Memory Optimized') },
                { value: 'r4.xlarge', description: t('4 vCPU, 30.5 GiB RAM - Memory Optimized') },
                { value: 'r4.2xlarge', description: t('8 vCPU, 61 GiB RAM - Memory Optimized') },
                { value: 'r4.4xlarge', description: t('16 vCPU, 122 GiB RAM - Memory Optimized') },
                { value: 'r4.8xlarge', description: t('32 vCPU, 244 GiB RAM - Memory Optimized') },
                { value: 'r4.16xlarge', description: t('64 vCPU, 488 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('R5 - 5% additional memory per vCPU over R4'),
              children: [
                { value: 'r5.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5.4xlarge', description: t('16 vCPU, 128GiB RAM - Memory Optimized') },
                { value: 'r5.8xlarge', description: t('32 vCPU, 256GiB RAM - Memory Optimized') },
                { value: 'r5.12xlarge', description: t('48 vCPU, 384GiB RAM - Memory Optimized') },
                { value: 'r5.16xlarge', description: t('64 vCPU, 512GiB RAM - Memory Optimized') },
                { value: 'r5.24xlarge', description: t('96 vCPU, 768GiB RAM - Memory Optimized') },
                { value: 'r5.metal', description: t('96 vCPU, 768GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('R5a - AMD processors'),
              children: [
                { value: 'r5a.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5a.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5a.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5a.4xlarge', description: t('16 vCPU, 128 GiB RAM - Memory Optimized') },
                { value: 'r5a.8xlarge', description: t('32 vCPU, 256 GiB RAM - Memory Optimized') },
                { value: 'r5a.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'r5a.16xlarge', description: t('64 vCPU, 512 GiB RAM - Memory Optimized') },
                { value: 'r5a.24xlarge', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('R5n - Network optimized'),
              children: [
                { value: 'r5n.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5n.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5n.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5n.4xlarge', description: t('16 vCPU, 128 GiB RAM - Memory Optimized') },
                { value: 'r5n.8xlarge', description: t('32 vCPU, 256 GiB RAM - Memory Optimized') },
                { value: 'r5n.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'r5n.16xlarge', description: t('64 vCPU, 512 GiB RAM - Memory Optimized') },
                { value: 'r5n.24xlarge', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('High Memory - Metal'),
              children: [
                { value: 'u-6tb1.metal', description: t('448 vCPU, 6144 GiB RAM - Memory Optimized') },
                { value: 'u-9tb1.metal', description: t('448 vCPU, 9216 GiB RAM - Memory Optimized') },
                {
                  value: 'u-12tb1.metal',
                  description: t('448 vCPU, 12288 GiB RAM - Memory Optimized'),
                },
                {
                  value: 'u-18tb1.metal',
                  description: t('448 vCPU, 18432 GiB RAM - Memory Optimized'),
                },
                {
                  value: 'u-24tb1.metal',
                  description: t('448 vCPU, 24576 GiB RAM - Memory Optimized'),
                },
              ],
            },
          ],
        },
        {
          label: t('With Xeon Processors'),
          children: [
            {
              label: t('X1 - Xeon processors'),
              children: [
                { value: 'x1.16xlarge', description: t('64 vCPU, 976 GiB RAM - Memory Optimized') },
                { value: 'x1.32xlarge', description: t('128 vCPU, 1,952 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('X1e - Xeon processors, in-memory database optimized'),
              children: [
                { value: 'x1e.xlarge', description: t('4 vCPU, 122 GiB RAM - Memory Optimized') },
                { value: 'x1e.2xlarge', description: t('8 vCPU, 244 GiB RAM - Memory Optimized') },
                { value: 'x1e.4xlarge', description: t('16 vCPU, 488 GiB RAM - Memory Optimized') },
                { value: 'x1e.8xlarge', description: t('32 vCPU, 976 GiB RAM - Memory Optimized') },
                { value: 'x1e.16xlarge', description: t('64 vCPU, 1,952 GiB RAM - Memory Optimized') },
                {
                  value: 'x1e.32xlarge',
                  description: t('128 vCPU, 3,904 GiB RAM - Memory Optimized'),
                },
              ],
            },
          ],
        },
        {
          label: t('With SSD'),
          children: [
            {
              label: t('R5d - With SSD'),
              children: [
                { value: 'r5d.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5d.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5d.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5d.4xlarge', description: t('16 vCPU, 128 GiB RAM - Memory Optimized') },
                { value: 'r5d.8xlarge', description: t('32 vCPU, 256 GiB RAM - Memory Optimized') },
                { value: 'r5d.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'r5d.16xlarge', description: t('64 vCPU, 512 GiB RAM - Memory Optimized') },
                { value: 'r5d.24xlarge', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
                { value: 'r5d.metal', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('R5dn - With SSD, network optimized'),
              children: [
                { value: 'r5dn.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5dn.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5dn.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5dn.4xlarge', description: t('16 vCPU, 128 GiB RAM - Memory Optimized') },
                { value: 'r5dn.8xlarge', description: t('32 vCPU, 256 GiB RAM - Memory Optimized') },
                { value: 'r5dn.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'r5dn.16xlarge', description: t('64 vCPU, 512 GiB RAM - Memory Optimized') },
                { value: 'r5dn.24xlarge', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('R5ad - With SSD, AMD processors'),
              children: [
                { value: 'r5ad.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'r5ad.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'r5ad.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'r5ad.4xlarge', description: t('16 vCPU, 128 GiB RAM - Memory Optimized') },
                { value: 'r5ad.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'r5ad.24xlarge', description: t('96 vCPU, 768 GiB RAM - Memory Optimized') },
              ],
            },
            {
              label: t('Z1d - With SSD, fastest processor'),
              children: [
                { value: 'z1d.large', description: t('2 vCPU, 16 GiB RAM - Memory Optimized') },
                { value: 'z1d.xlarge', description: t('4 vCPU, 32 GiB RAM - Memory Optimized') },
                { value: 'z1d.2xlarge', description: t('8 vCPU, 64 GiB RAM - Memory Optimized') },
                { value: 'z1d.3xlarge', description: t('12 vCPU, 96 GiB RAM - Memory Optimized') },
                { value: 'z1d.6xlarge', description: t('24 vCPU, 192 GiB RAM - Memory Optimized') },
                { value: 'z1d.12xlarge', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
                { value: 'z1d.metal', description: t('48 vCPU, 384 GiB RAM - Memory Optimized') },
              ],
            },
          ],
        },
      ],
    },
    {
      label: t('Accelerated Computing'),
      children: [
        {
          label: t('P3 - NVIDIA Tesla V100 GPUs'),
          children: [
            {
              value: 'p3.2xlarge',
              description: t('1 GPUs, 8 vCPU, 61 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'p3.8xlarge',
              description: t('4 GPUs, 32 vCPU, 244 GiB, 64 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'p3.16xlarge',
              description: t('8 GPUs, 64 vCPU, 488 GiB, 128 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'p3dn.24xlarge',
              description: t('8 GPUs, 96 vCPU, 768 GiB, 256 GPU GiB - Accelerated Computing'),
            },
          ],
        },
        {
          label: t('P2 - NVIDIA K80 GPUs'),
          children: [
            {
              value: 'p2.xlarge',
              description: t('1 GPUs, 4 vCPU, 61 GiB, 12 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'p2.8xlarge',
              description: t('8 GPUs, 32 vCPU, 488 GiB, 96 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'p2.16xlarge',
              description: t('16 GPUs, 64 vCPU, 732 GiB, 192 GPU GiB - Accelerated Computing'),
            },
          ],
        },
        {
          label: t('G4 - NVIDIA T4 Tensor Core GPUs'),
          children: [
            {
              value: 'g4dn.xlarge',
              description: t('1 GPUs, 4 vCPU, 16 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.2xlarge',
              description: t('1 GPUs, 8 vCPU, 32 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.4xlarge',
              description: t('1 GPUs, 16 vCPU, 64 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.8xlarge',
              description: t('1 GPUs, 32 vCPU, 128 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.16xlarge',
              description: t('1 GPUs, 64 vCPU, 256 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.12xlarge',
              description: t('4 GPUs, 48 vCPU, 192 GiB, 64 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g4dn.metal',
              description: t('8 GPUs, 96 vCPU, 384 GiB, 128 GPU GiB - Accelerated Computing'),
            },
          ],
        },
        {
          label: t('G3 - NVIDIA Tesla M60 GPUs'),
          children: [
            {
              value: 'g3s.xlarge',
              description: t('1 GPUs, 4 vCPU, 30.5 GiB, 8 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g3.4xlarge',
              description: t('1 GPUs, 16 vCPU, 122 GiB, 8 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g3.8xlarge',
              description: t('2 GPUs, 32 vCPU, 244 GiB, 16 GPU GiB - Accelerated Computing'),
            },
            {
              value: 'g3.16xlarge',
              description: t('4 GPUs, 64 vCPU, 488 GiB, 32 GPU GiB - Accelerated Computing'),
            },
          ],
        },
      ],
    },
    {
      label: t('Storage Optimized'),
      children: [
        {
          label: t('I3 - High Frequency Intel Xeon Processors'),
          children: [
            { value: 'i3.large', description: t('2 vCPU, 15.25 GiB RAM - Storage Optimized') },
            { value: 'i3.xlarge', description: t('4 vCPU, 30.5 GiB RAM - Storage Optimized') },
            { value: 'i3.2xlarge', description: t('8 vCPU, 61 GiB RAM - Storage Optimized') },
            { value: 'i3.4xlarge', description: t('16 vCPU, 122 GiB RAM - Storage Optimized') },
            { value: 'i3.8xlarge', description: t('32 vCPU, 244 GiB RAM - Storage Optimized') },
            { value: 'i3.16xlarge', description: t('64 vCPU, 488 GiB RAM - Storage Optimized') },
            { value: 'i3.metal', description: t('72 vCPU, 512GiB RAM - Storage Optimized') },
          ],
        },
        {
          label: t('I3en - Non-Volatile Memory Express SSD instance storage'),
          children: [
            { value: 'i3en.large', description: t('2 vCPU, 16 GiB RAM - Storage Optimized') },
            { value: 'i3en.xlarge', description: t('4 vCPU, 32 GiB RAM - Storage Optimized') },
            { value: 'i3en.2xlarge', description: t('8 vCPU, 64 GiB RAM - Storage Optimized') },
            { value: 'i3en.3xlarge', description: t('12 vCPU, 96 GiB RAM - Storage Optimized') },
            { value: 'i3en.6xlarge', description: t('24 vCPU, 192 GiB RAM - Storage Optimized') },
            { value: 'i3en.12xlarge', description: t('48 vCPU, 384 GiB RAM - Storage Optimized') },
            { value: 'i3en.24xlarge', description: t('96 vCPU, 768 GiB RAM - Storage Optimized') },
            { value: 'i3en.metal', description: t('96 vCPU, 768 GiB RAM - Storage Optimized') },
          ],
        },
        {
          label: t('D2 - Up to 48 TB of HDD-based local storage'),
          children: [
            { value: 'd2.xlarge', description: t('4 vCPU, 30.5 GiB RAM - Storage Optimized') },
            { value: 'd2.2xlarge', description: t('8 vCPU, 61 GiB RAM - Storage Optimized') },
            { value: 'd2.4xlarge', description: t('16 vCPU, 122 GiB RAM - Storage Optimized') },
            { value: 'd2.8xlarge', description: t('36 vCPU, 244 GiB RAM - Storage Optimized') },
          ],
        },
        {
          label: t('H1 - 16 TB of HDD-based local storage'),
          children: [
            { value: 'h1.2xlarge', description: t('8 vCPU, 32 GiB RAM - Storage Optimized') },
            { value: 'h1.4xlarge', description: t('16 vCPU, 64 GiB RAM - Storage Optimized') },
            { value: 'h1.8xlarge', description: t('32 vCPU, 128 GiB RAM - Storage Optimized') },
            { value: 'h1.16xlarge', description: t('64 vCPU, 256 GiB RAM - Storage Optimized') },
          ],
        },
      ],
    },
  ]
}

const awsPrivateControlData = (t) => {
  return [
    {
      id: 'privateAWS',
      type: 'step',
      title: t('creation.aws.privateAWS'),
    },
    {
      id: 'privateAWSTitle',
      type: 'title',
      info: t('creation.aws.privateAWS.info'),
    },
    {
      name: t('creation.aws.private.enable'),
      id: 'hasPrivateConfig',
      type: 'checkbox',
      active: false,
      onSelect: onChangeAWSPrivate,
    },
    {
      name: t('creation.aws.ami'),
      tooltip: t('creation.aws.ami.tooltip'),
      id: 'amiID',
      type: 'text',
      disabled: true,
      placeholder: t('creation.aws.ami.placeholder'),
      active: '',
      validation: getAlphanumericValidator(t),
    },
    {
      name: t('creation.aws.hostedZone'),
      tooltip: t('creation.aws.hostedZone.tooltip'),
      id: 'hostedZone',
      type: 'text',
      disabled: true,
      placeholder: t('creation.aws.hostedZone.placeholder'),
      active: '',
      validation: getAlphanumericWithPeriodValidator(t),
    },
    ///////////////////////  subnets  /////////////////////////////////////
    {
      id: 'privateLink',
      type: 'group',
      onlyOne: true,
      hidden: true,
      controlData: [
        {
          id: 'subnetSection',
          type: 'section',
          collapsable: true,
          collapsed: true,
          subtitle: t('creation.aws.subnet.subtitle'),
          info: t('creation.aws.subnet.info'),
        },
        {
          name: 'Subnet ID',
          tooltip: t('creation.aws.subnetID.tooltip'),
          id: 'subnetID',
          type: 'values',
          placeholder: t('creation.aws.subnetID.placeholder'),
          active: [],
          validation: getAlphanumericValidator(t),
        },
      ],
    },
    {
      id: 'serviceEndpoints',
      type: 'group',
      onlyOne: false,
      hidden: true,
      prompts: {
        nameId: 'tester',
        baseName: 'Subnet ID',
        addPrompt: t('creation.aws.serviceEndpoint.addPrompt'),
        deletePrompt: t('creation.aws.serviceEndpoint.deletePrompt'),
      },
      controlData: [
        ///////////////////////  Service Endpoints  /////////////////////////////////////
        {
          id: 'serviceEndpoint',
          type: 'section',
          collapsable: true,
          collapsed: true,
          subtitle: t('creation.aws.serviceEndpoint.subtitle'),
          info: t('creation.aws.serviceEndpoint.info'),
        },
        {
          name: t('Name'),
          tooltip: t('creation.aws.serviceEndpointName.tooltip'),
          id: 'endpointName',
          type: 'text',
          placeholder: t('creation.aws.serviceEndpointName.placeholder'),
          active: '',
          validation: getAlphanumericValidator(t),
        },
        {
          name: t('URL'),
          tooltip: t('creation.aws.serviceEndpointUrl.tooltip'),
          id: 'endpointURL',
          type: 'text',
          placeholder: t('creation.aws.serviceEndpointUrl.placeholder'),
          active: '',
          validation: getHttpsURLValidator(false),
        },
      ],
    },
  ]
}

export const getControlDataAWS = (
  t,
  handleModalToggle,
  includeAutomation,
  includeAwsPrivate,
  includeSno,
  includeKlusterletAddonConfig = true
) => {
  const controlData = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  connection  /////////////////////////////////////
    {
      id: 'detailStep',
      type: 'step',
      title: t('Cluster details'),
    },
    {
      id: 'infrastructure',
      name: t('Infrastructure'),
      active: 'AWS',
      type: 'reviewinfo',
    },
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: true,
      },
      available: [],
      providerId: 'aws',
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
      onSelect: onChangeConnection,
    },
    ...clusterDetailsControlData(t),
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
      name: t('cluster.create.ocp.image'),
      tooltip: t('tooltip.cluster.create.ocp.image'),
      id: 'imageSet',
      type: 'combobox',
      simplified: getSimplifiedImageName,
      placeholder: t('creation.ocp.cloud.select.ocp.image'),
      fetchAvailable: LOAD_OCP_IMAGES('aws', t),
      validation: {
        notification: t('creation.ocp.cluster.must.select.ocp.image'),
        required: true,
      },
      onSelect: onImageChange,
      reverse: reverseImageSet,
    },
    //Always Hidden
    {
      id: 'singleNodeFeatureFlag',
      type: 'checkbox',
      active: false,
      hidden: true,
    },
    {
      name: t('cluster.create.ocp.singleNode'),
      tooltip: t('tooltip.cluster.create.ocp.singleNode'),
      id: 'singleNode',
      type: 'checkbox',
      active: false,
      hidden: isHidden_lt_OCP48,
      onSelect: onChangeSNO,
      icon: <DevPreviewLabel />,
    },
    {
      name: t('creation.ocp.addition.labels'),
      id: 'additional',
      type: 'labels',
      active: [],
      tip: t(
        'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.'
      ),
    },
    {
      id: 'infrastructure',
      active: ['AWS'],
      type: 'hidden',
      hasReplacements: true,
      availableMap: {
        AWS: {
          replacements: {
            'install-config': { template: installConfig, encode: true, newTab: true },
          },
        },
      },
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  node(machine) pools  /////////////////////////////////////
    {
      id: 'nodePoolsStep',
      type: 'step',
      title: t('Node pools'),
    },
    {
      id: 'nodes',
      type: 'title',
      info: t('creation.ocp.cluster.node.pool.info'),
    },
    ///////////////////////  region  /////////////////////////////////////
    {
      name: t('creation.ocp.region'),
      tooltip: t('tooltip.creation.ocp.aws.region'),
      id: 'region',
      type: 'combobox',
      active: 'us-east-1',
      available: Object.keys(awsRegions),
      validation: getAlphanumericValidator(t),
      cacheUserValueKey: 'create.cluster.region',
      onSelect: setAWSZones,
      reverse: 'ClusterDeployment[0].metadata.labels.region',
    },
    ///////////////////////  architecture  /////////////////////////////////////
    ...architectureData(t),
    ///////////////////////  control plane pool  /////////////////////////////////////
    {
      id: 'masterPool',
      type: 'group',
      onlyOne: true, // no prompts
      controlData: [
        {
          id: 'masterPool',
          type: 'section',
          collapsable: true,
          collapsed: true,
          subtitle: t('creation.ocp.node.controlplane.pool.title'),
          info: t('creation.ocp.node.controlplane.pool.info'),
        },
        ///////////////////////  zone  /////////////////////////////////////
        {
          name: t('creation.ocp.zones'),
          tooltip: t('tooltip.creation.ocp.controlplane.zones'),
          id: 'masterZones',
          type: 'multiselect',
          available: [usEast1a, usEast1b, usEast1c, usEast1d, usEast1e, usEast1f],
          placeholder: t('creation.ocp.add.zones'),
          cacheUserValueKey: 'create.cluster.aws.master.zones',
          validation: getAlphanumericValidator(t),
          multiselect: true,
        },
        ///////////////////////  instance type  /////////////////////////////////////
        {
          name: t('creation.ocp.instance.type'),
          tooltip: t('tooltip.creation.ocp.aws.instance.type'),
          learnMore: 'https://aws.amazon.com/ec2/instance-types/',
          id: 'masterType',
          type: 'combobox',
          available: AWSmasterInstanceTypes(t),
          active: 'm5.xlarge',
          validation: {
            constraint: '[A-Za-z0-9.]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
            required: false,
          },
          cacheUserValueKey: 'create.cluster.master.type',
        },
        ///////////////////////  root volume  /////////////////////////////////////
        {
          name: t('creation.ocp.root.storage'),
          tooltip: t('tooltip.creation.ocp.aws.root.storage'),
          id: 'masterRootStorage',
          type: 'combobox',
          active: '100',
          available: ['100', '300', '500', '800', '1000', '1200'],
          validation: getNumericValidator(t),
          cacheUserValueKey: 'create.cluster.master.root.storage',
        },
      ],
    },
    ///////////////////////  worker pools  /////////////////////////////////////
    {
      id: 'workerPools',
      type: 'group',
      hidden: isHidden_SNO,
      prompts: {
        nameId: 'workerName',
        baseName: 'worker',
        addPrompt: t('creation.ocp.cluster.add.node.pool'),
        deletePrompt: t('creation.ocp.cluster.delete.node.pool'),
        disableDeleteForFirst: true,
      },
      onChange: updateWorkerZones,
      controlData: [
        {
          id: 'workerPool',
          type: 'section',
          collapsable: true,
          collapsed: true,
          subtitle: getWorkerName,
          info: t('creation.ocp.node.worker.pool.info'),
        },
        ///////////////////////  pool name  /////////////////////////////////////
        {
          name: t('creation.ocp.pool.name'),
          tooltip: t('tooltip.creation.ocp.pool.name'),
          placeholder: t('creation.ocp.pool.placeholder'),
          id: 'workerName',
          type: 'text',
          active: 'worker',
          validation: getAlphanumericValidator(t),
          disabled: disabledForFirstInGroup,
        },
        ///////////////////////  zone  /////////////////////////////////////
        {
          name: t('creation.ocp.zones'),
          tooltip: t('tooltip.creation.ocp.worker.zones'),
          id: 'workerZones',
          type: 'multiselect',
          available: [usEast1a, usEast1b, usEast1c, usEast1d, usEast1e, usEast1f],
          placeholder: t('creation.ocp.add.zones'),
          cacheUserValueKey: 'create.cluster.aws.worker.zones',
          validation: getAlphanumericValidator(t),
          multiselect: true,
        },
        ///////////////////////  instance type  /////////////////////////////////////
        {
          name: t('creation.ocp.instance.type'),
          tooltip: t('tooltip.creation.ocp.aws.instance.type'),
          learnMore: 'https://aws.amazon.com/ec2/instance-types/',
          id: 'workerType',
          type: 'treeselect',
          available: AWSworkerInstanceTypes(t),
          active: 'm5.xlarge',
          validation: {
            constraint: '[A-Za-z0-9.]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
            required: false,
          },
          cacheUserValueKey: 'create.cluster.worker.type',
        },
        ///////////////////////  compute node count  /////////////////////////////////////
        {
          name: t('creation.ocp.compute.node.count'),
          tooltip: t('tooltip.creation.ocp.compute.node.count'),
          id: 'computeNodeCount',
          type: 'number',
          initial: '3',
          validation: getNumericValidator(t),
          cacheUserValueKey: 'create.cluster.compute.node.count',
        },
        ///////////////////////  storage  /////////////////////////////////////
        {
          name: t('creation.ocp.root.storage'),
          tooltip: t('tooltip.creation.ocp.aws.root.storage'),
          id: 'workerStorage',
          type: 'combobox',
          active: '100',
          available: ['100', '300', '500', '800', '1000', '1200'],
          validation: getNumericValidator(t),
          cacheUserValueKey: 'create.cluster.persistent.storage',
        },
      ],
    },
    {
      id: 'networkStep',
      type: 'step',
      title: t('Networking'),
    },
    ...networkingControlData(t),
    ...proxyControlData(t),
  ]
  if (includeSno) {
    addSnoText(controlData, t)
  }

  if (includeAwsPrivate) {
    controlData.push(...awsPrivateControlData(t))
    const regionObject = controlData.find((object) => object.id === 'region')
    if (regionObject && regionObject.available) {
      awsRegions = { ...awsRegions, ...awsGovRegions }
      regionObject.available = regionObject.available.concat(Object.keys(awsRegions))
    }
  }
  if (includeAutomation) {
    controlData.push(...automationControlData(t))
  }
  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
  return controlData
}

export default getControlDataAWS
