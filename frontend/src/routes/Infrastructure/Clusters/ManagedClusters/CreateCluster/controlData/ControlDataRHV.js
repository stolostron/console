/* Copyright Contributors to the Open Cluster Management project */

import { getNumericValidator, getIPValidator } from '../../../../../../components/TemplateEditor'
import {
  LOAD_OCP_IMAGES,
  getSimplifiedImageName,
  proxyControlData,
  networkingControlData,
  automationControlData,
  getWorkerName,
  isHidden_lt_OCP48,
  isHidden_SNO,
  onChangeSNO,
  onChangeConnection,
  architectureData,
  appendKlusterletAddonConfig,
  clusterDetailsControlData,
  disabledForFirstInGroup,
  reverseImageSet,
  onImageChange,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import installConfigHbs from '../templates/install-config.hbs'
import Handlebars from 'handlebars'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

const installConfig = Handlebars.compile(installConfigHbs)

export const getControlDataRHV = (
  t,
  handleModalToggle,
  includeAutomation = true,
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
      active: 'RHV',
      type: 'reviewinfo',
    },
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: 'redhatvirtualization',
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: true,
      },
      available: [],
      onSelect: onChangeConnection,
      encode: ['cacertificate'],
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
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
      fetchAvailable: LOAD_OCP_IMAGES('rhv', t),
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
      id: 'ovirt_cluster_id',
      name: t('creation.ocp.cluster.rhv.ovirt_cluster_id'),
      tooltip: t('tooltip.creation.ocp.cluster.rhv.ovirt_cluster_id'),
      placeholder: t('creation.ocp.cluster.rhv.ovirt_cluster_id'),
      type: 'text',
      active: '',
      validation: {
        notification: t('creation.ocp.cluster.rhv.must.enter.ovirt_cluster_id'),
        required: true,
      },
    },
    {
      id: 'ovirt_storage_domain_id',
      name: t('creation.ocp.cluster.rhv.ovirt_storage_domain_id'),
      tooltip: t('tooltip.creation.ocp.cluster.rhv.ovirt_storage_domain_id'),
      placeholder: t('creation.ocp.cluster.rhv.ovirt_storage_domain_id'),
      type: 'text',
      active: '',
      validation: {
        notification: t('creation.ocp.cluster.rhv.must.enter.ovirt_storage_domain_id'),
        required: true,
      },
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
      active: ['RHV'],
      type: 'hidden',
      hasReplacements: true,
      availableMap: {
        RHV: {
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
        ///////////////////////  coresPerSocket  /////////////////////////////////////
        ///////////////////////  cores  /////////////////////////////////////
        {
          name: t('creation.ocp.cores'),
          tooltip: t('tooltip.creation.ocp.cores'),
          id: 'masterCores',
          type: 'number',
          initial: '4',
          validation: getNumericValidator(t),
        },
        ///////////////////////  sockets  /////////////////////////////////////
        {
          name: t('creation.ocp.sockets'),
          tooltip: t('tooltip.creation.ocp.sockets'),
          id: 'masterSockets',
          type: 'number',
          initial: '2',
          validation: getNumericValidator(t),
        },
        ///////////////////////  memoryMB  /////////////////////////////////////
        {
          name: t('creation.ocp.memoryMB'),
          tooltip: t('tooltip.creation.ocp.memoryMB'),
          id: 'masterMemoryMB',
          type: 'number',
          initial: '16348',
          validation: getNumericValidator(t),
        },
        ///////////////////////  root volume  /////////////////////////////////////
        {
          name: t('creation.ocp.diskSizeGB'),
          tooltip: t('tooltip.creation.ocp.ovirt.diskSizeGB'),
          id: 'masterRootStorage',
          type: 'number',
          initial: '120',
          validation: getNumericValidator(t),
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
        ///////////////////////  cores  /////////////////////////////////////
        {
          name: t('creation.ocp.cores'),
          tooltip: t('tooltip.creation.ocp.cores'),
          id: 'cores',
          type: 'number',
          initial: '4',
          validation: getNumericValidator(t),
        },
        ///////////////////////  sockets  /////////////////////////////////////
        {
          name: t('creation.ocp.sockets'),
          tooltip: t('tooltip.creation.ocp.sockets'),
          id: 'sockets',
          type: 'number',
          initial: '1',
          validation: getNumericValidator(t),
        },
        ///////////////////////  memoryMB  /////////////////////////////////////
        {
          name: t('creation.ocp.memoryMB'),
          tooltip: t('tooltip.creation.ocp.memoryMB'),
          id: 'memoryMB',
          type: 'number',
          initial: '16348',
          validation: getNumericValidator(t),
        },
        ///////////////////////  sizeGB  /////////////////////////////////////
        {
          name: t('creation.ocp.diskSizeGB'),
          tooltip: t('tooltip.creation.ocp.ovirt.diskSizeGB'),
          id: 'diskSizeGB',
          type: 'number',
          initial: '120',
          validation: getNumericValidator(t),
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

    ///////////////////////  networking  /////////////////////////////////////
    {
      id: 'networkStep',
      type: 'step',
      title: t('Networking'),
    },
    {
      id: 'ovirt_network_name',
      name: t('creation.ocp.cluster.rhv.network.name'),
      tooltip: t('tooltip.creation.ocp.cluster.rhv.network.name'),
      placeholder: t('creation.ocp.cluster.rhv.network.name.placeholder'),
      type: 'text',
      active: '',
      validation: {
        notification: t('creation.ocp.cluster.rhv.must.enter.network.name'),
        required: true,
      },
    },
    {
      id: 'vnicProfileID',
      name: t('creation.ocp.cluster.rhv.vnicprofileid'),
      tooltip: t('tooltip.creation.ocp.cluster.rhv.vnicprofileid'),
      placeholder: t('creation.ocp.cluster.rhv.vnicprofileid.placeholder'),
      type: 'text',
      active: '',
      validation: {
        notification: t('creation.ocp.cluster.rhv.must.enter.network.name'),
        required: true,
      },
    },
    {
      id: 'apiVIP',
      type: 'text',
      name: t('creation.ocp.api.vip'),
      tooltip: t('tooltip.creation.ocp.api.vip'),
      placeholder: t('creation.ocp.api.vip.placeholder'),
      active: '',
      validation: getIPValidator({
        subnet: { controlID: 'machineCIDR', groupID: 'networks' },
        differentFrom: ['ingressVIP'],
      }),
    },
    {
      id: 'ingressVIP',
      type: 'text',
      name: t('creation.ocp.ingress.vip'),
      tooltip: t('tooltip.creation.ocp.ingress.vip'),
      placeholder: t('creation.ocp.ingress.vip.placeholder'),
      active: '',
      validation: getIPValidator({
        subnet: { controlID: 'machineCIDR', groupID: 'networks' },
        differentFrom: ['apiVIP'],
      }),
    },
    ...networkingControlData(t),
    ...proxyControlData(t),
  ]
  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)

  if (includeAutomation) {
    return [...controlData, ...automationControlData(t)]
  }
  return controlData
}

export default getControlDataRHV
