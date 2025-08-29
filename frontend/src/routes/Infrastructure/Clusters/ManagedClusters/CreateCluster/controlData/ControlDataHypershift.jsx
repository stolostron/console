/* Copyright Contributors to the Open Cluster Management project */
import DetailsForm from '../components/assisted-installer/hypershift/DetailsForm'
import HostsForm from '../components/assisted-installer/hypershift/HostsForm'
import NetworkForm from '../components/assisted-installer/hypershift/NetworkForm'
import { automationControlData, appendKlusterletAddonConfig, appendWarning } from './ControlDataHelpers'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

export const getControlDataHypershift = (
  t,
  handleModalToggle,
  warning,
  includeAutomation = true,
  includeKlusterletAddonConfig = true
) => {
  const controlData = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
      id: 'hypershiftDetailStep',
      type: 'step',
      title: t('Cluster details'),
    },
    {
      id: 'infrastructure',
      name: t('Infrastructure'),
      active: 'Host inventory',
      type: 'reviewinfo',
    },
    {
      id: 'controlplane',
      name: t('Control plane type'),
      active: 'Hosted',
      type: 'reviewinfo',
    },
    /////////////////////// ACM Credentials  /////////////////////////////////////
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: 'hostinventory',
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: false,
      },
      available: [],
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
    },
    {
      id: 'hypershift',
      type: 'custom',
      component: <DetailsForm />,
      providerId: 'hypershift',
      encodeValues: ['pullSecret'],
      additionalProps: {
        promptSshPublicKey: false,
      },
    },
    {
      id: 'hypershiftHostsStep',
      type: 'step',
      title: t('Node pools'),
      disabled: true,
    },
    {
      id: 'hypershift-hosts',
      type: 'custom',
      component: <HostsForm />,
      providerId: 'hypershift',
    },
    {
      id: 'hyperhisftNetworkStep',
      type: 'step',
      title: t('Networking'),
      disabled: true,
    },
    {
      id: 'hypershift-network',
      type: 'custom',
      component: <NetworkForm />,
      providerId: 'hypershift',
    },
  ]
  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
  if (warning) {
    appendWarning(warning, controlData)
  }
  if (includeAutomation) {
    return [...controlData, ...automationControlData(t)]
  }
  return controlData
}

export default getControlDataHypershift
