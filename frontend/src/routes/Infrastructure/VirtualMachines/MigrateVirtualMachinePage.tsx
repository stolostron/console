/* Copyright Contributors to the Open Cluster Management project */
import { useParams, useNavigate } from 'react-router-dom-v5-compat'
import { AcmModal } from '../../../ui-components'
import { NavigationPath } from '../../../NavigationPath'
import { WizardPage } from '../../../wizards/WizardPage'
import {
  EditorValidationStatus,
  Step,
  useData,
  useEditorValidationStatus,
  useItem,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import { t } from 'i18next'
import { useWizardStrings } from '../../../lib/wizardStrings'
import { TextContent } from '@patternfly/react-core'
import { SyncEditor, ValidationStatus } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import schema from './schema.json'

export function WizardSyncEditor() {
  const resources = useItem()
  const { update } = useData()
  const { setEditorValidationStatus } = useEditorValidationStatus()
  const { t } = useTranslation()
  return (
    <SyncEditor
      editorTitle={t('Policy YAML')}
      variant="toolbar"
      resources={resources}
      schema={schema}
      filters={['*.metadata.managedFields']}
      immutables={['PlacementBinding.0.*']}
      onEditorChange={(changes: { resources: any[] }): void => {
        update(changes?.resources)
      }}
      onStatusChange={(editorStatus: ValidationStatus): void => {
        setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
      }}
    />
  )
}

function getWizardSyncEditor() {
  return <WizardSyncEditor />
}
export default function MigrateVirtualMachinePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Argo application steps'),
    contentAriaLabel: t('Argo application content'),
  })
  const cluster = id?.split('/')[0]
  console.log(cluster, 'ns')
  return (
    <AcmModal
      hasNoBodyWrapper={true}
      isOpen={true}
      width={'80%'}
      showClose={false}
      onClose={() => navigate(NavigationPath.virtualMachines)}
    >
      <WizardPage
        id="migrate-vm-wizard"
        title={t('Migrate Virtual Machines')}
        description={t('Choose the target location for your VMs, and review migration readiness.')}
        wizardStrings={translatedWizardStrings}
        defaultData={{
          cluster,
          namespace: 'default',
        }}
        onCancel={() => navigate(NavigationPath.virtualMachines)}
        onSubmit={(data) => {
          console.log('Migrate VM', id, data)
          navigate(NavigationPath.virtualMachines)
        }}
        submitButtonText={t('Migrate now')}
        submittingButtonText=""
        yamlEditor={getWizardSyncEditor}
      >
        <Step id="target" label={t('Target placement')}>
          <WizTextInput path="cluster" label="Cluster" disabled />
          <WizTextInput path="namespace" label="Project" disabled />
          <WizTextInput path="target.cluster" label={t('Cluster')} required />
          <WizTextInput path="target.server" label={t('Project')} required />
        </Step>
        <Step id="readiness" label={t('Migration readiness')}>
          <TextContent>
            <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus, mollitia?</div>
          </TextContent>
        </Step>
      </WizardPage>
    </AcmModal>
  )
}
