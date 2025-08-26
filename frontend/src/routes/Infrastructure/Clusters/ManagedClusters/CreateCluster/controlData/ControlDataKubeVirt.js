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
  updateDefaultPodNetwork,
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
            localCluster?.consoleURL
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

const filterOCPImages = (loadOCPImages, hypershiftSupportedVersions) => {
  const originalResult = loadOCPImages()
  return {
    ...originalResult,
    query: async () => {
      const images = await originalResult.query()
      return images.filter((image) =>
        hypershiftSupportedVersions.some((supportedVersion) => image.spec.releaseImage.startWith(supportedVersion))
      )
    },
  }
}

export const getControlDataKubeVirt = (
  t,
  handleModalToggle,
  warning,
  includeKlusterletAddonConfig = true,
  localCluster,
  hypershiftSupportedVersions
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
      fetchAvailable: filterOCPImages(() => LOAD_OCP_IMAGES('kubevirt', t), hypershiftSupportedVersions),
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
      active: {
        controllerAvailabilityPolicy: 'HighlyAvailable',
        infrastructureAvailabilityPolicy: 'HighlyAvailable',
      },
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
        ///////////////////////////// Node Pools Networking options section /////////////////////////////
        {
          id: 'networkingOptionsSection',
          type: 'section',
          collapsable: true,
          collapsed: true,
          title: t('Networking options'),
        },
        {
          id: 'networkInfo',
          type: 'title',
          info: t('Configure networking options for your nodepool'),
        },
        {
          id: 'additionalNetworks',
          type: 'multitext',
          name: t('Additional networks'),
          tooltip: t('tooltip.creation.nodepool.additional.network'),
          placeholder: t('Enter the additional network in the format <namespace>/<name>'),
          addButtonText: t('Add additional network'),
          active: { multitextEntries: [] },
          controlData: [
            {
              id: 'additionalNetworks',
              type: 'multitextMember',
              active: '',
            },
          ],
          onSelect: updateDefaultPodNetwork,
        },
        {
          name: t('Attach default pod network'),
          tooltip: t('tooltip.creation.ocp.node.pool.default.pod.network'),
          id: 'defaultPodNetwork',
          type: 'checkbox',
          active: true,
          disabled: true,
          validation: {
            required: false,
          },
        },
      ],
    },
    ///////////////////////////// Storage Mappings Step /////////////////////////////
    {
      id: 'storageMappingsStep',
      type: 'step',
      title: t('Storage mapping'),
    },
    {
      id: 'storageInfo',
      type: 'title',
      info: t('storage.mapping.info'),
    },
    {
      id: 'storageClassMapping',
      type: 'group',
      startWithNone: true, // start with no items in group
      prompts: {
        addPrompt: t('Add storage class mapping'),
        deletePrompt: t('Delete storage class mapping'),
      },
      controlData: [
        {
          id: 'storageMappingGroup',
          type: 'section',
          collapsable: true,
          subtitle: numberedControlNameFunction((i18n, num) => i18n('Storage class mapping {{num}}', { num })),
        },
        {
          id: 'infraStorageClassName',
          name: t('Infrastructure storage class'),
          tooltip: t(
            'The name of the infrastructure cluster storage class that is exposed in the guest cluster. You cannot change the mapping after creation.'
          ),
          type: 'text',
          placeholder: t('Enter infrastructure cluster storage class'),
          validation: {
            constraint: VALID_DNS_LABEL,
            required: true,
          },
        },
        {
          id: 'guestStorageClassName',
          name: t('Guest storage class'),
          tooltip: t('The name that is used for this storage class within the guest cluster.'),
          type: 'text',
          placeholder: t('Enter guest cluster storage class name'),
          validation: {
            constraint: VALID_DNS_LABEL,
            required: true,
          },
        },
        {
          id: 'storageClassGroup',
          name: t('Group'),
          tooltip: t(
            'Optional: Enter a group name matching a storage class group. This snapshot class only works with storage classes that share the same group name.'
          ),
          type: 'text',
          placeholder: t('Enter group name'),
        },
      ],
    },
    {
      id: 'volumeSnapshotClassMapping',
      type: 'group',
      startWithNone: true, // start with no items in group
      tooltip: t(
        'Map infrastructure volume snapshot classes to guest cluster volume snapshot classes. These mappings cannot be changed after cluster creation.'
      ),
      prompts: {
        addPrompt: t('Add volume snapshot class mapping'),
        deletePrompt: t('Delete volume snapshot class mapping'),
      },
      controlData: [
        {
          id: 'snapshotMappingGroup',
          type: 'section',
          collapsable: true,
          subtitle: numberedControlNameFunction((i18n, num) => i18n('Volume snapshot class mapping {{num}}', { num })),
        },
        {
          id: 'infraVolumeSnapshotClassName',
          name: t('Infrastructure volume snapshot class'),
          tooltip: t(
            'The name of the infrastructure cluster volume snapshot class that is exposed in the guest cluster.'
          ),
          type: 'text',
          placeholder: t('Enter infrastructure cluster volume snapshot class'),
          validation: {
            constraint: VALID_DNS_LABEL,
            required: true,
          },
        },
        {
          id: 'guestVolumeSnapshotClassName',
          name: t('Guest volume snapshot class'),
          tooltip: t('The name that is used for this volume snapshot class within the guest cluster.'),
          type: 'text',
          placeholder: t('Enter guest cluster volume snapshot class name'),
          validation: {
            constraint: VALID_DNS_LABEL,
            required: true,
          },
        },
        {
          id: 'volumeSnapshotGroup',
          name: t('Group'),
          tooltip: t('Optional group name to associate volume snapshot classes with storage classes'),
          type: 'text',
          placeholder: t('Enter group name'),
          validation: {
            required: false,
          },
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
