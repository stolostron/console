/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../lib/acm-i18next'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useContext } from 'react'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { AcmToastContext } from '../../ui-components'
import { FormData } from '../../components/AcmFormData'
import { NavigationPath } from '../../NavigationPath'
import '../WizardPage.css'
import { FormGroup, Title, Split, TextInput, Button } from '@patternfly/react-core'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import ArrowRightIcon from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon'
import { useMigrationFormState } from './useMigrationFormState'
import ReadinessSection from './RedinessChecks'

export function VMWizardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toastContext = useContext(AcmToastContext)

  const {
    srcCluster,
    srcNs,
    dstCluster,
    setDstCluster,
    dstNamespace,
    setDstNamespace,
    srcNetwork,
    setSrcNetwork,
    dstNetwork,
    setDstNetwork,
    srcStorage,
    setSrcStorage,
    dstStorage,
    setDstStorage,
    srcCompute,
    setSrcCompute,
    dstCompute,
    setDstCompute,
    openDstCluster,
    setOpenDstCluster,
    openDstNamespace,
    setOpenDstNamespace,
  } = useMigrationFormState()

  const clusterOptions = [
    { id: 'c1', value: 'dev', text: 'dev-cluster' },
    { id: 'c2', value: 'prod', text: 'prod-cluster' },
  ]

  const namespaceOptions = [
    { id: '1', value: '1', text: '1' },
    { id: '2', value: '2', text: '2' },
  ]

  const networkOptions = [
    { id: 'network1', value: 'network1', text: 'network1' },
    { id: 'network2', value: 'network2', text: 'network2' },
  ]

  const storageOptions = [
    { id: 'source1', value: 'source1', text: 'source1' },
    { id: 'source2', value: 'source2', text: 'source2' },
  ]

  const computeOptions = [
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
      toastContext.addAlert({
        title: t('Migration started'),
        message: t('The VM migration is in progress'),
        type: 'info',
        autoClose: true,
      })
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
                  <FormGroup label="Cluster" fieldId="srcCluster" style={{ margin: '1rem' }}>
                    <TextInput value="Cluster 1" isDisabled />
                  </FormGroup>
                  <FormGroup label="Project" fieldId="srcNs" style={{ margin: '1rem' }}>
                    <TextInput value="namespace 1" isDisabled />
                  </FormGroup>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                  <Split>
                    <Title headingLevel="h4">
                      Target <span style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>*</span>
                    </Title>
                    <Button variant="link" isInline isDisabled style={{ marginLeft: '3rem' }}>
                      Clear all
                    </Button>
                  </Split>
                  <FormGroup label="Cluster" fieldId="dstCluster" style={{ margin: '1rem' }}>
                    <Select
                      variant={SelectVariant.single}
                      isOpen={openDstCluster}
                      selections={dstCluster}
                      placeholderText="Select Cluster"
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
                  <FormGroup label="Project" fieldId="dstNamespace" style={{ margin: '1rem' }}>
                    <Select
                      variant={SelectVariant.single}
                      isOpen={openDstNamespace}
                      selections={dstNamespace}
                      isDisabled={!dstCluster}
                      placeholderText={dstCluster ? 'Select Project' : 'To select project, fill cluster fisrt'}
                      onToggle={(_, isOpen) => setOpenDstNamespace(isOpen)}
                      onSelect={(_, value) => {
                        setDstNamespace(value as string)
                        setOpenDstNamespace(false)
                      }}
                    >
                      {namespaceOptions.map((o) => (
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
        hideYaml={true}
        isModalWizard
      />
    </div>
  )
}
