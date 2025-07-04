// /* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useState } from 'react'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData, SelectOptionInput } from '../../components/AcmFormData'
import { NavigationPath } from '../../NavigationPath'
import '../WizardPage.css'
import {
  Tabs,
  Tab,
  TabTitleText,
  TabContentBody,
  FormGroup,
  Title,
  Split,
  Divider,
  TextInput,
} from '@patternfly/react-core'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import CheckIcon from '@patternfly/react-icons/dist/esm/icons/check-icon'
import { CheckCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import { StorageBulletChart } from './StorageBulletChart'
import ArrowRightIcon from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon'

interface ReadinessProps {
  networkOpts: SelectOptionInput[]
  storageOpts: SelectOptionInput[]
  computeOptions: SelectOptionInput[]
  srcNetwork: string
  setSrcNetwork: (v: string) => void
  dstNetwork: string
  setDstNetwork: (v: string) => void
  srcStorage: string
  setSrcStorage: (v: string) => void
  dstStorage: string
  setDstStorage: (v: string) => void
  srcCompute: string
  setSrcCompute: (v: string) => void
  dstCompute: string
  setDstCompute: (v: string) => void
}

const ReadinessSection: React.FC<ReadinessProps> = ({
  networkOpts,
  storageOpts,
  srcNetwork,
  dstNetwork,
  setDstNetwork,
  setDstStorage,
  dstStorage,
  srcCompute,
  dstCompute,
}) => {
  const [activeTabKey, setActiveTabKey] = useState(0)
  const [openDst, setOpenDst] = useState(false)
  const [openDstStorage, setOpenDstStorage] = useState(false)
  const [isEditingTargetNetwork, setIsEditingTargetNetwork] = useState(false)
  const [isEditingTargetStorage, setIsEditingTargetStorage] = useState(false)
  // const [srcVersion, setSrcVersion] = useState('4.20')
  // const [trgVersion, setTrgVersion] = useState('4.20')
  // const [srcVirtVersion, setSrcVirtVersion] = useState('4.19')
  // const [trgVirtVersion, setTrgVirtVersion] = useState('4.19')

  const networkForm = (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Network mapping
      </Title>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup
          label={
            <Title headingLevel="h4" style={{ margin: 0 }}>
              Source network
            </Title>
          }
          fieldId="src-net"
          style={{ flex: 1, padding: 0 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              minHeight: 36,
            }}
          >
            {srcNetwork || '-'}
          </div>
        </FormGroup>
        <FormGroup
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title headingLevel="h4" style={{ margin: 0 }}>
                Target network
              </Title>
              {!isEditingTargetNetwork && (
                <button
                  type="button"
                  onClick={() => setIsEditingTargetNetwork(true)}
                  style={{
                    marginLeft: '1rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--pf-v5-global--link--Color)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <PencilAltIcon style={{ marginRight: 4 }} /> Edit
                </button>
              )}
            </div>
          }
          fieldId="dst-net"
          style={{ flex: 1 }}
        >
          {!isEditingTargetNetwork ? (
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {dstNetwork || '-'}
            </div>
          ) : (
            <Select
              id="dst-net"
              variant={SelectVariant.single}
              isOpen={openDst}
              selections={dstNetwork}
              onToggle={(_, isOpen) => setOpenDst(isOpen)}
              onSelect={(_, v) => {
                setDstNetwork(v as string)
                setOpenDst(false)
                setIsEditingTargetNetwork(false)
              }}
            >
              {networkOpts.map((o) => (
                <SelectOption key={o.id} value={o.value}>
                  {o.text}
                </SelectOption>
              ))}
            </Select>
          )}
        </FormGroup>
      </div>
    </>
  )
  const storageForm = (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Storage mapping
      </Title>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup
          label={
            <Title headingLevel="h4" style={{ margin: 0 }}>
              Target storage
            </Title>
          }
          fieldId="src-net"
          style={{ flex: 1, padding: 0 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              minHeight: 36,
            }}
          >
            {srcNetwork || '-'}
          </div>
        </FormGroup>

        <FormGroup
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title headingLevel="h4" style={{ margin: 0 }}>
                Target storage
              </Title>
              {!isEditingTargetStorage && (
                <button
                  type="button"
                  onClick={() => setIsEditingTargetNetwork(true)}
                  style={{
                    marginLeft: '1rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--pf-v5-global--link--Color)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <PencilAltIcon style={{ marginRight: 4 }} /> Edit
                </button>
              )}
            </div>
          }
          fieldId="dst-net"
          style={{ flex: 1 }}
        >
          {!isEditingTargetStorage ? (
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {dstStorage || '-'}
            </div>
          ) : (
            <Select
              id="dst-net"
              variant={SelectVariant.single}
              isOpen={openDstStorage}
              selections={dstStorage}
              onToggle={(_, isOpen) => setOpenDstStorage(isOpen)}
              onSelect={(_, v) => {
                setDstStorage(v as string)
                setOpenDstStorage(false)
                setIsEditingTargetStorage(false)
              }}
            >
              {storageOpts.map((o) => (
                <SelectOption key={o.id} value={o.value}>
                  {o.text}
                </SelectOption>
              ))}
            </Select>
          )}
        </FormGroup>
      </div>
    </>
  )
  const computeCompatibilityForm = (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Compute compatibility
      </Title>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <FormGroup
          label={
            <Title headingLevel="h4" style={{ margin: 0 }}>
              Source cluster compute
            </Title>
          }
          fieldId="src-net"
          style={{ flex: 1, padding: 0 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
            }}
          >
            {srcCompute || '-'}
          </div>
        </FormGroup>

        <FormGroup
          label={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title headingLevel="h4" style={{ margin: 0 }}>
                Target cluster compute
              </Title>
            </div>
          }
          fieldId="dst-net"
          style={{ flex: 1 }}
        >
          <div
            style={{
              border: '1px solid var(--pf-v5-global--BorderColor-100)',
              borderRadius: 4,
              minHeight: 36,
            }}
          >
            {dstCompute || '-'}
          </div>
        </FormGroup>
      </div>
    </>
  )
  const versionCompatibilityForm = (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Version compatibility
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title headingLevel="h5" style={{ marginBottom: '0.5rem' }}>
          OpenShift version
        </Title>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <FormGroup label="Source cluster" fieldId="src-ocp" style={{ flex: 1, padding: 0 }}>
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {/* {srcVersion || '-'} */}
              '4.20'
            </div>
          </FormGroup>

          <FormGroup label="Target cluster" fieldId="dst-ocp" style={{ flex: 1, padding: 0 }}>
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {/* {trgVersion || '-'} */}
              '4.20'
            </div>
          </FormGroup>
        </div>
      </div>

      <Divider style={{ width: '70%' }} />

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2rem' }}>
        <Title headingLevel="h5" style={{ marginBottom: '0.5rem' }}>
          Virtualization operator version
        </Title>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <FormGroup label="Source cluster" fieldId="src-virt" style={{ flex: 1, padding: 0 }}>
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {/* {srcVirtVersion || '-'} */}
              '4.19'
            </div>
          </FormGroup>

          <FormGroup label="Target cluster" fieldId="dst-virt" style={{ flex: 1, padding: 0 }}>
            <div
              style={{
                border: '1px solid var(--pf-v5-global--BorderColor-100)',
                borderRadius: 4,
                minHeight: 36,
              }}
            >
              {/* {trgVirtVersion || '-'} */}
              '4.19'
            </div>
          </FormGroup>
        </div>
      </div>
    </>
  )
  const resourceCapacityForm = (
    <>
      <Title headingLevel="h3" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        Resource capacity
      </Title>
      <Title headingLevel={'h5'}>Source size</Title>
      <div>Storage XXX GB</div>
      <div>Memory XXX GB</div>
      <div>CPU XXX GB</div>
      <Divider style={{ margin: '1rem 0', width: '70%' }} />
      <Title headingLevel={'h5'}>Target cluster capacity (Cluster 2)</Title>
      <Split style={{ marginBottom: '5rem' }}>
        <StorageBulletChart />
        <StorageBulletChart />
      </Split>
      <Split style={{ marginBottom: '5rem' }}>
        <StorageBulletChart />
      </Split>
    </>
  )
  const NetworkMappingTab = () => networkForm
  const StorageMappingTab = () => storageForm
  const ComputeCompatTab = () => computeCompatibilityForm
  const VersionCompatTab = () => versionCompatibilityForm
  const ResourceCapacityTab = () => resourceCapacityForm

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
    <>
      <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content' }}>
        <Title headingLevel="h3">
          <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)', marginRight: 6 }} />
          Ready to migrate
        </Title>
        <div style={{ textAlign: 'end' }}>5 successful checks</div>
      </div>
      {/* <Divider style={{ marginLeft: '-2rem', width: '120%' }} /> */}
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ minWidth: 240, maxWidth: 260 }}>
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
                // style={{ padding: '1rem 1.6rem', borderRight: '1px solid #d2d2d2' }}
              />
            ))}
          </Tabs>
        </div>
        <div style={{ flex: 1, paddingLeft: 24 }}>
          <TabContentBody>{readinessTabs[activeTabKey].content}</TabContentBody>
        </div>
      </div>
    </>
  )
}

export function VMWizardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [srcCluster] = useState('Cluster')
  const [srcNs] = useState('Namespace')
  const [dstCluster, setDstCluster] = useState('')
  const [dstNamespace, setDstNamespace] = useState('')
  const [srcNetwork, setSrcNetwork] = useState('network1')
  const [dstNetwork, setDstNetwork] = useState('')
  const [srcStorage, setSrcStorage] = useState('')
  const [dstStorage, setDstStorage] = useState('')
  const [srcCompute, setSrcCompute] = useState('')
  const [dstCompute, setDstCompute] = useState('')
  const [openDstCluster, setOpenDstCluster] = useState(false)
  const [openDstNamespace, setOpenDstNamespace] = useState(false)

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
    { id: 'network1', value: 'network1', text: 'network1' },
    { id: 'network2', value: 'network2', text: 'network2' },
  ]
  const storageOptions: SelectOptionInput[] = [
    { id: 'source1', value: 'source1', text: 'source1' },
    { id: 'source2', value: 'source2', text: 'source2' },
  ]
  const computeOptions: SelectOptionInput[] = [
    { id: 'compute1', value: 'compute1', text: 'compute1' },
    { id: 'compute2', value: 'compute2', text: 'compute2' },
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
      source: {
        cluster: srcCluster,
        namespace: srcNs,
        network: srcNetwork,
        storage: srcStorage,
        compute: srcCompute,
      },
      destination: {
        cluster: dstCluster,
        namespace: dstNamespace,
        network: dstNetwork,
        storage: dstStorage,
        compute: dstCompute,
      },
    }),

    stateToSyncs: () => [
      { path: 'destination.cluster', setState: setDstCluster },
      { path: 'destination.namespace', setState: setDstNamespace },
      { path: 'source.network', setState: setSrcNetwork },
      { path: 'destination.network', setState: setDstNetwork },
      { path: 'source.storage', setState: setSrcStorage },
      { path: 'destination.storage', setState: setDstStorage },
    ],
    sections: [
      {
        type: 'Section',
        title: t('Target placement'),
        inputs: [
          {
            id: 'targetPlacement',
            type: 'Custom',
            value: dstCluster && dstNamespace ? 'valid' : '',
            isRequired: true,
            validate: !!(dstCluster && dstNamespace),
            component: (
              <Split hasGutter style={{ marginTop: '1rem' }}>
                <div
                  style={{
                    flex: 1,
                    border: '1px solid #d2d2d2',
                    borderRadius: 8,
                    padding: 24,
                  }}
                >
                  <Title headingLevel="h4">Source</Title>
                  <FormGroup label="Cluster" fieldId="srcCluster" style={{ marginTop: 16 }}>
                    <TextInput
                      isRequired
                      type="text"
                      id="simple-form-name-01"
                      name="simple-form-name-01"
                      aria-describedby="simple-form-name-01-helper"
                      value={'Cluster 1'}
                      isDisabled
                    />
                  </FormGroup>
                  <FormGroup label="Project" fieldId="srcNs" style={{ marginTop: 16 }}>
                    <TextInput
                      isRequired
                      type="text"
                      id="simple-form-name-01"
                      name="simple-form-name-01"
                      aria-describedby="simple-form-name-01-helper"
                      value={'namespace 1'}
                      isDisabled
                    />
                  </FormGroup>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'gray' }}>
                  <ArrowRightIcon color="var(--pf-v5-global--Color-200)" />
                </div>
                <div
                  style={{
                    flex: 1,
                    border: '1px solid #d2d2d2',
                    borderRadius: 8,
                    padding: 24,
                  }}
                >
                  <Title headingLevel="h4">Target *</Title>
                  <FormGroup label="Cluster" fieldId="dstCluster" style={{ marginTop: 16 }}>
                    <Select
                      id="dstCluster"
                      variant={SelectVariant.single}
                      isOpen={openDstCluster}
                      selections={dstCluster}
                      onToggle={(_, isOpen) => setOpenDstCluster(isOpen)}
                      onSelect={(_, value) => {
                        setDstCluster(value as string)
                        setOpenDstCluster(false)
                      }}
                    >
                      {clusterOptions.map((o) => (
                        <SelectOption key={o.id} value={o.value}>
                          {o.text}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Project" fieldId="dstNamespace" style={{ marginTop: 16 }}>
                    <Select
                      id="dstNamespace"
                      variant={SelectVariant.single}
                      isOpen={openDstNamespace}
                      selections={dstNamespace}
                      isDisabled={!dstCluster}
                      onToggle={(_, isOpen) => setOpenDstNamespace(isOpen)}
                      onSelect={(_, value) => {
                        setDstNamespace(value as string)
                        setOpenDstNamespace(false)
                      }}
                    >
                      {(dstCluster ? namespaceOptions[dstCluster] : []).map((o) => (
                        <SelectOption key={o.id} value={o.value}>
                          {o.text}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                </div>
              </Split>
            ),
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
                storageOpts={storageOptions}
                computeOptions={computeOptions}
                srcNetwork={srcNetwork}
                setSrcNetwork={setSrcNetwork}
                dstNetwork={dstNetwork}
                setDstNetwork={setDstNetwork}
                srcStorage={srcStorage}
                setSrcStorage={setSrcStorage}
                dstStorage={dstStorage}
                setDstStorage={setDstStorage}
                srcCompute={srcCompute}
                setSrcCompute={setSrcCompute}
                dstCompute={dstCompute}
                setDstCompute={setDstCompute}
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

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <AcmDataFormPage
        formData={formData}
        mode="wizard"
        editorTitle={t('Migration YAML')}
        hideYaml={false}
        isModalWizard
      />
    </div>
  )
}
