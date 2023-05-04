/* Copyright Contributors to the Open Cluster Management project */

import { getAlphanumericValidator, getNumericValidator } from '../../../../../../components/TemplateEditor'
import {
  LOAD_OCP_IMAGES,
  clusterPoolDetailsControlData,
  disabledForFirstInGroup,
  networkingControlData,
  proxyControlData,
  automationControlData,
  getSimplifiedImageName,
  getWorkerName,
  isHidden_lt_OCP48,
  isHidden_SNO,
  onChangeSNO,
  onChangeConnection,
  addSnoText,
  architectureData,
  onImageChange,
  reverseImageSet,
} from '../../../ManagedClusters/CreateCluster/controlData/ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'
import installConfigHbs from '../../../ManagedClusters/CreateCluster/templates/install-config.hbs'
import Handlebars from 'handlebars'

const installConfig = Handlebars.compile(installConfigHbs)

const GCPregions = [
  'asia-east1',
  'asia-east2',
  'asia-northeast1',
  'asia-northeast2',
  'asia-northeast3',
  'asia-south1',
  'asia-south2',
  'asia-southeast1',
  'asia-southeast2',
  'australia-southeast1',
  'australia-southeast2',
  'europe-central2',
  'europe-north1',
  'europe-southwest1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-west6',
  'europe-west8',
  'europe-west9',
  'europe-west12',
  'me-west1',
  'northamerica-northeast1',
  'northamerica-northeast2',
  'southamerica-east1',
  'southamerica-west1',
  'us-central1',
  'us-east1',
  'us-east4',
  'us-east5',
  'us-south1',
  'us-west1',
  'us-west2',
  'us-west3',
  'us-west4',
]

const GCPmasterInstanceTypes = (t) => {
  return [
    { value: 'n1-standard-4', description: t('n1-standard-4 4 vCPU - General Purpose') },
    { value: 'n1-standard-8', description: t('n1-standard-8 8 vCPU - General Purpose') },
    { value: 'n1-standard-16', description: t('n1-standard-16 16 vCPU - General Purpose') },
    { value: 'n1-standard-32', description: t('n1-standard-32 32 vCPU - General Purpose') },
    { value: 'n1-standard-64', description: t('n1-standard-64 64 vCPU - General Purpose') },
    { value: 'n1-standard-96', description: t('n1-standard-96 96 vCPU - General Purpose') },
  ]
}

const GCPworkerInstanceTypes = (t) => {
  return [
    {
      label: t('General Purpose'),
      children: [
        {
          label: t('E2 machine types'),
          children: [
            {
              label: t('E2 standard machine types'),
              children: [
                { value: 'e2-standard-2', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'e2-standard-4', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'e2-standard-8', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'e2-standard-16', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
              ],
            },
            {
              label: 'E2 high-memory machine types',
              children: [
                { value: 'e2-highmem-2', description: t('2 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'e2-highmem-4', description: t('4 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'e2-highmem-8', description: t('8 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'e2-highmem-16', description: t('16 vCPU, 128 GiB RAM - General Purpose') },
              ],
            },
            {
              label: 'E2 high-CPU machine types',
              children: [
                { value: 'e2-highcpu-2', description: t('2 vCPU, 2 GiB RAM - General Purpose') },
                { value: 'e2-highcpu-4', description: t('4 vCPU, 4 GiB RAM - General Purpose') },
                { value: 'e2-highcpu-8', description: t('8 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'e2-highcpu-16', description: t('16 vCPU, 16 GiB RAM - General Purpose') },
              ],
            },
          ],
        },

        {
          label: t('N2 machine types'),
          children: [
            {
              label: t('N2 standard machine types'),
              children: [
                { value: 'n2-standard-2', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'n2-standard-4', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2-standard-8', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2-standard-16', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2-standard-32', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'n2-standard-48', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'n2-standard-64', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'n2-standard-80', description: t('80 vCPU, 320 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N2 high-memory machine types'),
              children: [
                { value: 'n2-highmem-2', description: t('2 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2-highmem-4', description: t('4 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2-highmem-8', description: t('8 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2-highmem-16', description: t('16 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'n2-highmem-32', description: t('32 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'n2-highmem-48', description: t('48 vCPU, 384 GiB RAM - General Purpose') },
                { value: 'n2-highmem-64', description: t('64 vCPU, 512 GiB RAM - General Purpose') },
                { value: 'n2-highmem-80', description: t('80 vCPU, 640 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N2 high-CPU machine types'),
              children: [
                { value: 'n2-highcpu-2', description: t('2 vCPU, 2 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-4', description: t('4 vCPU, 4 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-8', description: t('8 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-16', description: t('16 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-32', description: t('32 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-48', description: t('48 vCPU, 48 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-64', description: t('64 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2-highcpu-80', description: t('80 vCPU, 80 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N2D standard machine types with SSD'),
              children: [
                { value: 'n2d-standard-2', description: t('2 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'n2d-standard-4', description: t('4 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2d-standard-8', description: t('8 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2d-standard-16', description: t('16 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2d-standard-32', description: t('32 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'n2d-standard-48', description: t('48 vCPU, 192 GiB RAM - General Purpose') },
                { value: 'n2d-standard-64', description: t('64 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'n2d-standard-80', description: t('80 vCPU, 320 GiB RAM - General Purpose') },
                { value: 'n2d-standard-96', description: t('96 vCPU, 384 GiB RAM - General Purpose') },
                {
                  value: 'n2d-standard-128',
                  description: t('128 vCPU, 512 GiB RAM - General Purpose'),
                },
                {
                  value: 'n2d-standard-224',
                  description: t('224 vCPU, 896 GiB RAM - General Purpose'),
                },
              ],
            },
            {
              label: t('N2D high-memory machine types with SSD'),
              children: [
                { value: 'n2d-highmem-2', description: t('2 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-4', description: t('4 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-8', description: t('8 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-16', description: t('16 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-32', description: t('32 vCPU, 256 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-48', description: t('48 vCPU, 384 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-64', description: t('64 vCPU, 512 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-80', description: t('80 vCPU, 640 GiB RAM - General Purpose') },
                { value: 'n2d-highmem-96', description: t('96 vCPU, 768 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N2D high-CPU machine types with SSD'),
              children: [
                { value: 'n2d-highcpu-2', description: t('2 vCPU, 2 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-4', description: t('4 vCPU, 4 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-8', description: t('8 vCPU, 8 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-16', description: t('16 vCPU, 16 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-32', description: t('32 vCPU, 32 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-48', description: t('48 vCPU, 48 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-64', description: t('64 vCPU, 64 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-80', description: t('80 vCPU, 80 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-96', description: t('96 vCPU, 96 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-128', description: t('128 vCPU, 128 GiB RAM - General Purpose') },
                { value: 'n2d-highcpu-224', description: t('224 vCPU, 224 GiB RAM - General Purpose') },
              ],
            },
          ],
        },

        {
          label: t('N1 machine types'),
          children: [
            {
              label: t('N1 standard machine types'),
              children: [
                { value: 'n1-standard-1', description: t('1 vCPU, 3.75 GiB RAM - General Purpose') },
                { value: 'n1-standard-2', description: t('2 vCPU, 7.50 GiB RAM - General Purpose') },
                { value: 'n1-standard-4', description: t('4 vCPU, 15 GiB RAM - General Purpose') },
                { value: 'n1-standard-8', description: t('8 vCPU, 30 GiB RAM - General Purpose') },
                { value: 'n1-standard-16', description: t('16 vCPU, 60 GiB RAM - General Purpose') },
                { value: 'n1-standard-32', description: t('32 vCPU, 120 GiB RAM - General Purpose') },
                { value: 'n1-standard-64', description: t('64 vCPU, 240 GiB RAM - General Purpose') },
                { value: 'n1-standard-96', description: t('96 vCPU, 360 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N1 high-memory machine types'),
              children: [
                { value: 'n1-highmem-2', description: t('2 vCPU, 13 GiB RAM - General Purpose') },
                { value: 'n1-highmem-4', description: t('4 vCPU, 26 GiB RAM - General Purpose') },
                { value: 'n1-highmem-8', description: t('8 vCPU, 52 GiB RAM - General Purpose') },
                { value: 'n1-highmem-16', description: t('16 vCPU, 104 GiB RAM - General Purpose') },
                { value: 'n1-highmem-32', description: t('32 vCPU, 208 GiB RAM - General Purpose') },
                { value: 'n1-highmem-64', description: t('64 vCPU, 416 GiB RAM - General Purpose') },
                { value: 'n1-highmem-96', description: t('96 vCPU, 624 GiB RAM - General Purpose') },
              ],
            },
            {
              label: t('N1 high-CPU machine types'),
              children: [
                { value: 'n1-highcpu-2', description: t('2 vCPU, 1.80 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-4', description: t('4 vCPU, 3.60 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-8', description: t('8 vCPU, 7.20 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-16', description: t('16 vCPU, 14.4 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-32', description: t('32 vCPU, 28.8 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-64', description: t('64 vCPU, 57.6 GiB RAM - General Purpose') },
                { value: 'n1-highcpu-96', description: t('96 vCPU, 86.4 GiB RAM - General Purpose') },
              ],
            },
          ],
        },
      ],
    },
    {
      label: t('Compute Optimized'),
      children: [
        { value: 'c2-standard-4', description: t('4 vCPU, 16 GiB RAM - Compute Optimized') },
        { value: 'c2-standard-8', description: t('8 vCPU, 32 GiB RAM - Compute Optimized') },
        { value: 'c2-standard-16', description: t('16 vCPU, 64 GiB RAM - Compute Optimized') },
        { value: 'c2-standard-30', description: t('30 vCPU, 120 GiB RAM - Compute Optimized') },
        { value: 'c2-standard-60', description: t('60 vCPU, 240 GiB RAM - Compute Optimized') },
      ],
    },
    {
      label: t('Memory Optimized'),
      children: [
        { value: 'm2-ultramem-2084', description: t('208 vCPU, 5888 GiB RAM - Memory Optimized') },
        { value: 'm2-ultramem-4164', description: t('416 vCPU, 11,776 GiB RAM - Memory Optimized') },
        { value: 'm1-ultramem-40', description: t('40 vCPU, 961 GiB RAM - Memory Optimized') },
        { value: 'm1-ultramem-80', description: t('80 vCPU, 1922 GiB RAM - Memory Optimized') },
        { value: 'm1-ultramem-160', description: t('160 vCPU, 3844 GiB RAM - Memory Optimized') },
        { value: 'm1-megamem-96', description: t('96 vCPU, 1433.6 GiB RAM - Memory Optimized') },
      ],
    },
  ]
}

export const getControlDataGCP = (t, handleModalToggle, includeAutomation = true, includeSno = false) => {
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
      active: 'GCP',
      type: 'reviewinfo',
    },
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: 'gcp',
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: true,
      },
      available: [],
      onSelect: onChangeConnection,
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
    },
    ...clusterPoolDetailsControlData(t),
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  imageset  /////////////////////////////////////
    {
      name: t('cluster.create.ocp.image'),
      tooltip: t('tooltip.cluster.create.ocp.image'),
      id: 'imageSet',
      type: 'combobox',
      simplified: getSimplifiedImageName,
      placeholder: t('creation.ocp.cloud.select.ocp.image'),
      fetchAvailable: LOAD_OCP_IMAGES('gcp', t),
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
      active: ['GCP'],
      type: 'hidden',
      hasReplacements: true,
      availableMap: {
        GCP: {
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
      tooltip: t('tooltip.creation.ocp.gcp.region'),
      id: 'region',
      type: 'combobox',
      active: 'us-east1',
      available: GCPregions,
      validation: getAlphanumericValidator(t),
      cacheUserValueKey: 'create.cluster.region',
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
        ///////////////////////  instance type  /////////////////////////////////////
        {
          name: t('creation.ocp.instance.type'),
          tooltip: t('tooltip.creation.ocp.gcp.instance.type'),
          learnMore: 'https://cloud.google.com/compute/docs/machine-types',
          id: 'masterType',
          type: 'combobox',
          available: GCPmasterInstanceTypes(t),
          active: 'n1-standard-4',
          validation: {
            constraint: '[A-Za-z0-9-]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
            required: false,
          },
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
          validation: {
            constraint: '[A-Za-z0-9-_]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric'),
            required: true,
          },
          disabled: disabledForFirstInGroup,
        },
        ///////////////////////  instance type  /////////////////////////////////////
        {
          name: t('creation.ocp.instance.type'),
          tooltip: t('tooltip.creation.ocp.gcp.instance.type'),
          learnMore: 'https://cloud.google.com/compute/docs/machine-types',
          id: 'workerType',
          type: 'treeselect',
          available: GCPworkerInstanceTypes(t),
          active: 'n1-standard-4',
          validation: {
            constraint: '[A-Za-z0-9-]+',
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
  if (includeAutomation) {
    return [...controlData, ...automationControlData(t)]
  }
  return controlData
}

export default getControlDataGCP
