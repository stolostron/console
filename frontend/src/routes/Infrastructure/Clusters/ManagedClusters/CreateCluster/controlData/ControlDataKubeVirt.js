/* Copyright Contributors to the Open Cluster Management project */
import { Alert } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { CreateCredentialModal } from '../../../../../../components/CreateCredentialModal'
import {
  getNumericValidator,
  getNumericGTValidator,
  VALID_DNS_LABEL,
} from '../../../../../../components/TemplateEditor'
import { AcmButton } from '../../../../../../ui-components'
import {
  appendKlusterletAddonConfig,
  appendWarning,
  getSimplifiedImageName,
  LOAD_ETCD_CLASSES,
  LOAD_OCP_IMAGES,
  numberedControlNameFunction,
  onChangeConnection,
  onImageChange,
  reverseImageSet,
  reverseStorageClass,
} from './ControlDataHelpers'
import AvailabilityOptionsForm, { summary } from '../components/AvailabilityOptionsForm'

const operatorAlert = (localCluster, t) => {
  return (
    <Alert style={{ marginBottom: '1rem' }} isInline variant={'danger'} title={t('Operator required')}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ margin: '0.5rem 0' }}>
          {t('OpenShift Virtualization operator is required to create a cluster.')}
        </span>
        <AcmButton
          variant="link"
          component="a"
          isInline
          href={
            localCluster.consoleURL
              ? `${localCluster.consoleURL}/operatorhub/all-namespaces?keyword=Openshift+Virtualization`
              : ''
          }
          target="_blank"
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {t('Install operator')}
        </AcmButton>
      </div>
    </Alert>
  )
}

export const getControlDataKubeVirt = (
  t,
  handleModalToggle,
  warning,
  includeKlusterletAddonConfig = true,
  localCluster
) => {
  const controlData = [
    //////////////////////////////////  AI form  //////////////////////////////////
    {
      id: 'kubevirtDetailStep',
      type: 'step',
      title: t('Cluster details'),
    },
    {
      id: 'infrastructure',
      name: t('Infrastructure'),
      active: 'OpenShift Virtualization',
      type: 'reviewinfo',
    },
    {
      id: 'controlplane',
      name: t('Control plane type'),
      active: 'Hosted',
      type: 'reviewinfo',
    },
    {
      id: 'kubevirt-operator-alert',
      type: 'custom',
      hidden: false, // toggled in CreateCluster.tsx
      component: operatorAlert(localCluster, t),
    },
    /////////////////////// ACM Credentials /////////////////////////////////////
    {
      name: t('creation.ocp.cloud.connection'),
      tooltip: t('tooltip.creation.ocp.cloud.connection'),
      id: 'connection',
      type: 'singleselect',
      placeholder: t('creation.ocp.cloud.select.connection'),
      providerId: 'kubevirt',
      validation: {
        notification: t('creation.ocp.cluster.must.select.connection'),
        required: true,
      },
      available: [],
      footer: <CreateCredentialModal handleModalToggle={handleModalToggle} />,
      onSelect: onChangeConnection,
      hasReplacements: true,
    },
    {
      id: 'showSecrets',
      type: 'hidden',
      active: true,
    },
    {
      name: t('creation.ocp.name'),
      tooltip: t('tooltip.creation.ocp.name'),
      placeholder: t('creation.ocp.name.placeholder'),
      id: 'clusterName',
      type: 'text',
      validation: {
        constraint: VALID_DNS_LABEL,
        notification: t('import.form.invalid.dns.label'),
        required: true,
      },
    },
    {
      name: t('Hosted cluster namespace'),
      tooltip: t('tooltip.creation.ocp.hosted.cluster.namespace'),
      id: 'namespace',
      type: 'combobox',
    },
    {
      name: t('creation.ocp.clusterSet'),
      tooltip: t('tooltip.creation.ocp.clusterSet'),
      id: 'clusterSet',
      type: 'singleselect',
      placeholder: t('placeholder.creation.ocp.clusterSet'),
      validation: {
        required: false,
      },
      available: [],
    },
    {
      name: t('cluster.create.ocp.image'),
      tooltip: t('tooltip.cluster.create.ocp.image'),
      id: 'releaseImage',
      type: 'combobox',
      simplified: getSimplifiedImageName,
      placeholder: t('creation.ocp.cloud.select.ocp.image'),
      fetchAvailable: LOAD_OCP_IMAGES('kubevirt', t),
      validation: {
        notification: t('creation.ocp.cluster.must.select.ocp.image'),
        required: true,
      },
      onSelect: onImageChange,
      reverse: reverseImageSet,
    },
    {
      name: t('Etcd storage class'),
      tooltip: t('Persistent volume storage class for etcd data volumes'),
      id: 'storageClassName',
      type: 'combobox',
      placeholder: t('Select etcd storage class'),
      fetchAvailable: LOAD_ETCD_CLASSES(t),
      validation: {
        notification: t('Select a storage class'),
        required: false,
      },
      reverse: reverseStorageClass,
    },
    {
      id: 'availabilityOptions',
      type: 'custom',
      component: <AvailabilityOptionsForm />,
      active: { controller: 'HighlyAvailable', infra: 'HighlyAvailable' },
      summary: summary,
    },
    {
      id: 'additionalLabels',
      name: t('creation.ocp.addition.labels'),
      type: 'labels',
      active: [],
      tooltip: t(
        'Use labels to organize and place application subscriptions and policies on this cluster. The placement of resources are controlled by label selectors. If your cluster has the labels that match the resource placement’s label selector, the resource will be installed on your cluster after creation.'
      ),
    },
    ///////////////////////////// Node Pools Step /////////////////////////////
    {
      id: 'nodepoolsStep',
      type: 'step',
      title: t('Node pools'),
    },
    {
      id: 'nodepools',
      type: 'group',
      prompts: {
        addPrompt: t('Add node pool'),
        deletePrompt: t('creation.ocp.cluster.delete.node.pool'),
      },
      controlData: [
        {
          id: 'nodepoolsGroup',
          type: 'section',
          collapsable: true,
          subtitle: numberedControlNameFunction((i18n, num) => i18n('creation.ocp.node.pool.title', num)),
        },
        {
          id: 'nodePoolName',
          type: 'text',
          name: t('Node pool name'),
          tooltip: t('tooltip.creation.ocp.node.pool.name'),
          placeholder: t('Enter node pool name'),
          validation: {
            constraint: VALID_DNS_LABEL,
            notification: t('import.form.invalid.dns.label'),
            required: true,
          },
        },
        {
          name: t('Node pool replica'),
          tooltip: t('tooltip.creation.ocp.node.pool.replica.count'),
          id: 'nodePoolReplica',
          type: 'number',
          initial: '2',
          validation: getNumericValidator(t),
        },
        {
          name: t('Core'),
          tooltip: t('tooltip.creation.ocp.node.pool.core.count'),
          id: 'nodePoolCoreCount',
          type: 'number',
          initial: '2',
          validation: getNumericGTValidator(t, 0),
        },
        {
          name: t('creation.ocp.memoryGB'),
          tooltip: t('tooltip.creation.ocp.node.pool.memoryGB'),
          id: 'nodePoolMemory',
          type: 'number',
          initial: '8',
          validation: getNumericGTValidator(t, 0),
        },
        {
          name: t('Auto repair'),
          tooltip: t('tooltip.creation.ocp.node.pool.autorepair'),
          id: 'nodePoolAutoRepair',
          type: 'boolean',
          isTrue: false,
        },
        // Root Volume section - wizard doesn't support subgroup right now
        {
          id: 'rootVolumeSection',
          type: 'section',
          collapsable: true,
          collapsed: true,
          title: t('Root volume option'),
        },
        {
          name: t('Size (GiB)'),
          tooltip: t('tooltip.creation.ocp.node.pool.root.vol.size'),
          id: 'rootVolumeSize',
          type: 'number',
          initial: '32',
        },
        {
          id: 'rootVolumeStorageClass',
          name: t('Root Volume Storage Class'),
          tooltip: t('tooltip.creation.ocp.node.pool.root.vol.storageclass'),
          placeholder: t('Enter Storage Class'),
          type: 'text',
        },
        {
          name: t('Access mode'),
          tooltip: t('tooltip.creation.ocp.node.pool.root.vol.accessmode'),
          id: 'rootVolumeAccessMode',
          type: 'combobox',
          placeholder: t('Select an access mode'),
          available: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnly', 'ReadWriteOncePod'],
        },
        {
          name: t('Volume mode'),
          tooltip: t('tooltip.creation.ocp.node.pool.root.vol.volumemode'),
          id: 'rootVolumeVolMode',
          type: 'combobox',
          placeholder: t('Select a volume mode'),
          available: ['Block', 'Filesystem'],
        },
      ],
    },
  ]
  appendKlusterletAddonConfig(includeKlusterletAddonConfig, controlData)
  if (warning) {
    appendWarning(warning, controlData)
  }
  return controlData
}

export default getControlDataKubeVirt
