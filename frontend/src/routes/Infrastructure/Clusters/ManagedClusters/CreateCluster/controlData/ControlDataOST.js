/* Copyright Contributors to the Open Cluster Management project */

import { getNumericValidator, getIPValidator, getURLValidator } from '../../../../../../components/TemplateEditor'
import {
  LOAD_OCP_IMAGES,
  clusterDetailsControlData,
  disabledForFirstInGroup,
  proxyControlData,
  automationControlData,
  getSimplifiedImageName,
  getOSTNetworkingControlData,
  getWorkerName,
  isHidden_lt_OCP48,
  isHidden_gt_OCP46,
  isHidden_SNO,
  onChangeSNO,
  onChangeConnection,
  onChangeDisconnect,
  addSnoText,
  architectureData,
  appendKlusterletAddonConfig,
  onImageChange,
  reverseImageSet,
} from './ControlDataHelpers'
import { DevPreviewLabel } from '../../../../../../components/TechPreviewAlert'
import installConfigHbs from '../templates/install-config.hbs'
import Handlebars from 'handlebars'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

const installConfig = Handlebars.compile(installConfigHbs)

export const getControlDataOST = (
  t,
  handleModalToggle,
  includeAutomation = true,
  includeKlusterletAddonConfig = true,
  includeSno = false
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
      active: 'OpenStack',
      type: 'reviewinfo',
    },
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: 'ost',
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
      fetchAvailable: LOAD_OCP_IMAGES('ost', t),
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
      active: ['OpenStack'],
      type: 'hidden',
      hasReplacements: true,
      availableMap: {
        OpenStack: {
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
        ///////////////////////  instance type  /////////////////////////////////////
        {
          name: t('creation.ocp.instance.type'),
          tooltip: t('tooltip.creation.ocp.otp.instance.type'),
          id: 'masterType',
          type: 'text',
          active: 'm1.xlarge',
          validation: {
            constraint: '[A-Za-z0-9-_.]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
            required: true,
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
          tooltip: t('tooltip.creation.ocp.otp.instance.type'),
          id: 'workerType',
          type: 'text',
          active: 'm1.xlarge',
          validation: {
            constraint: '[A-Za-z0-9-_.]+',
            notification: t('creation.ocp.cluster.valid.alphanumeric.period'),
            required: true,
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
    ///////////////////////  openstack  /////////////////////////////////////
    {
      id: 'networkStep',
      type: 'step',
      title: t('Networking'),
    },
    {
      id: 'externalNetworkName',
      name: t('creation.ocp.cluster.ost.external.network.name'),
      tooltip: t('tooltip.creation.ocp.cluster.ost.external.network.name'),
      type: 'text',
      active: '',
      validation: {
        notification: t('creation.ocp.cluster.ost.must.enter.external.network.name'),
        required: true,
      },
    },
    {
      id: 'lbFloatingIP',
      type: 'text',
      name: t('creation.ocp.cluster.ost.lb.floating.ip'),
      placeholder: t('placeholder.creation.ocp.cluster.ost.lb.floating.ip'),
      tooltip: t('tooltip.creation.ocp.cluster.ost.lb.floating.ip'),
      hidden: (control, controlData) => {
        if (isHidden_gt_OCP46(control, controlData)) {
          control.active = undefined
          return true
        }
      },
      active: '',
      validation: getIPValidator({ differentFrom: ['ingressFloatingIP'] }),
    },
    {
      id: 'apiFloatingIP',
      type: 'text',
      name: t('creation.ocp.cluster.ost.api.floating.ip'),
      placeholder: t('placeholder.creation.ocp.cluster.ost.api.floating.ip'),
      tooltip: t('tooltip.creation.ocp.cluster.ost.api.floating.ip'),
      hidden: (control, ctrlData) => {
        if (!isHidden_gt_OCP46(control, ctrlData)) {
          control.active = undefined
          return true
        }
      },
      active: '',
      validation: getIPValidator({ differentFrom: ['ingressFloatingIP'] }),
    },
    {
      id: 'ingressFloatingIP',
      type: 'text',
      name: t('creation.ocp.cluster.ost.ingress.floating.ip'),
      placeholder: t('placeholder.creation.ocp.cluster.ost.ingress.floating.ip'),
      tooltip: t('tooltip.creation.ocp.cluster.ost.ingress.floating.ip'),
      active: '',
      validation: getIPValidator({ differentFrom: ['lbFloatingIP', 'apiFloatingIP'] }),
    },
    {
      id: 'externalDNS',
      type: 'values',
      name: t('creation.ocp.cluster.ost.external.dns'),
      placeholder: t('placeholder.creation.ocp.cluster.ost.external.dns'),
      tooltip: t('tooltip.creation.ocp.cluster.ost.external.dns'),
      active: [],
      validation: getIPValidator({ optional: true }),
    },
    ...getOSTNetworkingControlData(t),
    ...proxyControlData(t),
    ///////////////////////  openstack  /////////////////////////////////////
    {
      id: 'disconnectedStep',
      type: 'step',
      title: t('Disconnected installation'),
    },
    {
      id: 'disconnectedInfo',
      type: 'title',
      info: t(
        'Restricted networks which do not have direct access to the Internet require a mirror location of the Red Hat Enterprise Linux CoreOS image.'
      ),
    },
    {
      name: t('Create disconnected installation'),
      id: 'isDisconnected',
      type: 'checkbox',
      active: false,
      onSelect: onChangeDisconnect,
    },
    {
      id: 'clusterOSImage',
      type: 'text',
      name: t('Cluster OS image'),
      disabled: true,
      tip: t('The location of the Red Hat Enterprise Linux CoreOS image in your local registry.'),
      validation: getURLValidator(t),
    },
    {
      id: 'imageContentSources',
      type: 'textarea',
      name: t('Image Content Sources'),
      disabled: true,
      tip: t('The imageContentSources values that were generated during mirror registry creation.'),
    },
    {
      id: 'disconnectedAdditionalTrustBundle',
      type: 'textarea',
      name: t('Additional trust bundle'),
      disabled: true,
      placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
      tip: t(
        'The contents of the certificate file that you used for your mirror registry, which can be an existing, trusted certificate authority or the self-signed certificate that you generated for the mirror registry.'
      ),
    },
  ]
  if (includeSno) {
    addSnoText(controlData, t)
  }
  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
  if (includeAutomation) {
    return [...controlData, ...automationControlData(t)]
  }
  return controlData
}

export default getControlDataOST
