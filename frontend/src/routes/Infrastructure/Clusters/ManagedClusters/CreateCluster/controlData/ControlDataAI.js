/* Copyright Contributors to the Open Cluster Management project */

import DetailsForm from '../components/assisted-installer/DetailsForm'
import { automationControlData, appendKlusterletAddonConfig } from './ControlDataHelpers'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'

export const getControlDataAI = (t, handleModalToggle, includeKlusterletAddonConfig = true) => {
  const controlData = [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  AI form  /////////////////////////////////////
    {
      id: 'aiDetailStep',
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
      active: 'Standalone',
      type: 'reviewinfo',
    },
    /////////////////////// ACM Credentials  /////////////////////////////////////
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: ['hybrid', 'hostinventory'],
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: false,
      },
      available: [],
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
    },
    {
      id: 'ai',
      type: 'custom',
      component: <DetailsForm />,
      providerId: 'ai',
      mustValidate: true,
      encodeValues: ['pullSecret'],
      additionalProps: {
        promptSshPublicKey: true,
        aiFlow: true,
      },
    },
    ...automationControlData(t),
    {
      id: 'reviewSave',
      type: 'review',
      title: t('Review and save'),
      nextButtonLabel: t('Save'),
      comment: t(
        'Ensure these settings are correct. The saved cluster draft will be used to determine the available network resources. Therefore after you press Save you will not be able to change these cluster settings.'
      ),
      disableEditorOnSuccess: true,
      disablePreviousControlsOnSuccess: true,
    },
    {
      id: 'aiHostsStep',
      type: 'step',
      title: t('Hosts'),
      disabled: true,
    },
    {
      id: 'aiNetworkStep',
      type: 'step',
      title: t('Networking'),
      disabled: true,
    },
  ]

  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
  return controlData
}

export default getControlDataAI
