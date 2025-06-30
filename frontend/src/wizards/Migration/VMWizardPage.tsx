// /* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useState } from 'react'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData, SelectOptionInput } from '../../components/AcmFormData'
import { NavigationPath } from '../../NavigationPath'
import '../WizardPage.css'
import { Tabs, Tab, TabTitleText, TabContentBody, Form, FormGroup } from '@patternfly/react-core'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import CheckIcon from '@patternfly/react-icons/dist/esm/icons/check-icon'

interface ReadinessProps {
  networkOpts: SelectOptionInput[]
  srcNetwork: string
  setSrcNetwork: (v: string) => void
  dstNetwork: string
  setDstNetwork: (v: string) => void
}

const ReadinessSection: React.FC<ReadinessProps> = ({
  networkOpts,
  srcNetwork,
  setSrcNetwork,
  dstNetwork,
  setDstNetwork,
}) => {
  const [activeTabKey, setActiveTabKey] = useState(0)
  const [openSrc, setOpenSrc] = useState(false)
  const [openDst, setOpenDst] = useState(false)

  const networkForm = (
    <Form isHorizontal>
      <FormGroup label="Source network" fieldId="src-net">
        <Select
          id="src-net"
          variant={SelectVariant.single}
          isOpen={openSrc}
          selections={srcNetwork}
          onToggle={(_, isOpen) => setOpenSrc(isOpen)}
          onSelect={(_, v) => {
            setSrcNetwork(v as string)
            setOpenSrc(false)
          }}
        >
          {networkOpts.map((o) => (
            <SelectOption key={o.id} value={o.value}>
              {o.text}
            </SelectOption>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Destination network" fieldId="dst-net">
        <Select
          id="dst-net"
          variant={SelectVariant.single}
          isOpen={openDst}
          selections={dstNetwork}
          onToggle={(_, isOpen) => setOpenDst(isOpen)}
          onSelect={(_, v) => {
            setDstNetwork(v as string)
            setOpenDst(false)
          }}
        >
          {networkOpts.map((o) => (
            <SelectOption key={o.id} value={o.value}>
              {o.text}
            </SelectOption>
          ))}
        </Select>
      </FormGroup>
    </Form>
  )
  const NetworkMappingTab = () => networkForm
  const StorageMappingTab = () => (
    <Form isHorizontal>
      <FormGroup label="Source network" fieldId="src-net">
        <Select
          id="src-net"
          variant={SelectVariant.single}
          isOpen={openSrc}
          selections={srcNetwork}
          onToggle={(_, isOpen) => setOpenSrc(isOpen)}
          onSelect={(_, v) => {
            setSrcNetwork(v as string)
            setOpenSrc(false)
          }}
        >
          {networkOpts.map((o) => (
            <SelectOption key={o.id} value={o.value}>
              {o.text}
            </SelectOption>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Destination network" fieldId="dst-net">
        <Select
          id="dst-net"
          variant={SelectVariant.single}
          isOpen={openDst}
          selections={dstNetwork}
          onToggle={(_, isOpen) => setOpenDst(isOpen)}
          onSelect={(_, v) => {
            setDstNetwork(v as string)
            setOpenDst(false)
          }}
        >
          {networkOpts.map((o) => (
            <SelectOption key={o.id} value={o.value}>
              {o.text}
            </SelectOption>
          ))}
        </Select>
      </FormGroup>
    </Form>
  )

  const ComputeCompatTab = () => <div style={{ padding: 24 }}>Compute compatibility content</div>

  const VersionCompatTab = () => <div style={{ padding: 24 }}>Version compatibility content</div>

  const ResourceCapacityTab = () => <div style={{ padding: 24 }}>Resource capacity content</div>
  const readinessTabs = [
    {
      label: 'Network mapping',
      icon: <CheckIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />,
      content: <NetworkMappingTab />,
    },
    {
      label: 'Storage mapping',
      icon: <CheckIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />,
      content: <StorageMappingTab />,
    },
    {
      label: 'Compute compatibility',
      icon: <CheckIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />,
      content: <ComputeCompatTab />,
    },
    {
      label: 'Version compatibility',
      icon: <CheckIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />,
      content: <VersionCompatTab />,
    },
    {
      label: 'Resource capacity',
      icon: <CheckIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />,
      content: <ResourceCapacityTab />,
    },
  ] as const

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ minWidth: 240, maxWidth: 260, marginTop: '2rem' }}>
        <Tabs
          isVertical
          activeKey={activeTabKey}
          onSelect={(_, k) => setActiveTabKey(Number(k))}
          aria-label="Readiness tabs"
          role="region"
          style={{ marginLeft: '-1.6rem' }}
        >
          {readinessTabs.map((tab, idx) => (
            <Tab
              key={tab.label}
              eventKey={idx}
              title={
                <TabTitleText>
                  {tab.icon}
                  {tab.label}
                </TabTitleText>
              }
              style={{ padding: '1rem 1.6rem' }}
            />
          ))}
        </Tabs>
      </div>
      <div style={{ flex: 1, paddingLeft: 24 }}>
        <TabContentBody>{readinessTabs[activeTabKey].content}</TabContentBody>
      </div>
    </div>
  )
}

export function VMWizardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [srcCluster] = useState('Cluster')
  const [srcNs] = useState('Namespace')
  const [dstCluster, setDstCluster] = useState('')
  const [dstNamespace, setDstNamespace] = useState('')
  const [srcNetwork, setSrcNetwork] = useState('')
  const [dstNetwork, setDstNetwork] = useState('')

  const clusterOptions: SelectOptionInput[] = [
    { id: 'c1', value: 'dev', text: 'dev-cluster' },
    { id: 'c2', value: 'prod', text: 'prod-cluster' },
  ]
  const namespaceOptions: Record<string, SelectOptionInput[]> = {
    dev: [
      { id: 'ns1', value: 'demo', text: 'demo' },
      { id: 'ns2', value: 'test', text: 'test' },
    ],
    prod: [
      { id: 'ns3', value: 'frontend', text: 'frontend' },
      { id: 'ns4', value: 'backend', text: 'backend' },
    ],
  }
  const networkOptions: SelectOptionInput[] = [
    { id: 'n1', value: 'net-a', text: 'net-a' },
    { id: 'n2', value: 'net-b', text: 'net-b' },
  ]

  const formData: FormData = {
    title: t('Virtual machine migration'),
    description: t('Choose the target location for your VMs, and review migration readiness.'),
    submitText: t('Migrate now'),
    submittingText: t('Migrating…'),
    cancelLabel: t('Cancel'),
    backLabel: t('Back'),
    nextLabel: t('Next'),
    hideReview: true,

    submit: () => {
      console.log('Submitted:', formData.stateToData())
      navigate(NavigationPath.virtualMachines)
    },
    cancel: () => navigate(NavigationPath.virtualMachines),

    stateToData: () => ({
      source: { cluster: srcCluster, namespace: srcNs, network: srcNetwork },
      destination: { cluster: dstCluster, namespace: dstNamespace, network: dstNetwork },
    }),
    stateToSyncs: () => [
      { path: 'destination.cluster', setState: setDstCluster },
      { path: 'destination.namespace', setState: setDstNamespace },
      { path: 'source.network', setState: setSrcNetwork },
      { path: 'destination.network', setState: setDstNetwork },
    ],

    sections: [
      {
        type: 'Section',
        title: t('Target placement'),
        inputs: [
          {
            id: 'srcCluster',
            type: 'Text',
            label: t('Cluster'),
            value: srcCluster,
            onChange: () => {},
            isDisabled: true,
          },
          { id: 'srcNs', type: 'Text', label: t('Namespace'), value: srcNs, onChange: () => {}, isDisabled: true },
          {
            id: 'dstCluster',
            type: 'Select',
            label: t('Cluster'),
            value: dstCluster,
            options: clusterOptions,
            onChange: setDstCluster,
            isRequired: true,
            variant: 'typeahead',
          },
          {
            id: 'dstNamespace',
            type: 'Select',
            label: t('Namespace'),
            value: dstNamespace,
            options: dstCluster ? namespaceOptions[dstCluster] : [],
            onChange: setDstNamespace,
            isRequired: true,
            isDisabled: !dstCluster,
            variant: 'typeahead',
          },
        ],
      },

      {
        type: 'Section',
        title: t('Migration readiness'),
        inputs: [
          {
            id: 'readiness',
            type: 'Custom',
            value: '',
            component: (
              <ReadinessSection
                networkOpts={networkOptions}
                srcNetwork={srcNetwork}
                setSrcNetwork={setSrcNetwork}
                dstNetwork={dstNetwork}
                setDstNetwork={setDstNetwork}
              />
            ),
          },
          {
            id: 'srcNetworkHidden',
            type: 'Text',
            label: t('Source network'),
            value: srcNetwork,
            onChange: () => {},
            isRequired: true,
            isHidden: true,
          },
          {
            id: 'dstNetworkHidden',
            type: 'Text',
            label: t('Destination network'),
            value: dstNetwork,
            onChange: () => {},
            isRequired: true,
            isHidden: true,
          },
        ],
      },
    ],

    reviewTitle: '',
    reviewDescription: '',
  }

  return <AcmDataFormPage formData={formData} mode="wizard" editorTitle={t('Migration YAML')} hideYaml={false} />
}
