/* Copyright Contributors to the Open Cluster Management project */
import { t } from 'i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { useState } from 'react'

export function MigrationDetailedPage() {
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const title = t('Migrate virtual machines')
  const breadcrumbs = [{ text: t('Virtualization'), to: NavigationPath.virtualizationManagement }, { text: title }]

  const formData: FormData = {
    title,
    description: t('Choose the target location for your VMs, and review migration readiness'),
    breadcrumb: breadcrumbs,
    sections: [
      {
        type: 'Section',
        title: t('General information'),
        wizardTitle: t('General information'),
        inputs: [
          {
            id: 'name',
            type: 'Text',
            label: 'Name',
            placeholder: 'Enter access control name',
            isRequired: true,
            value: name,
            onChange: setName,
            // validation: (value: string) => {},
          },
          {
            id: 'reason',
            type: 'Text',
            label: 'Migration reason',
            placeholder: 'Enter reason for migration',
            value: reason,
            onChange: setReason,
          },
        ],
      },
      {
        type: 'Section',
        title: t('Target placement'),
        wizardTitle: t('Target placement'),
        inputs: [
          {
            id: 'target-placement',
            type: 'Custom',
            value: {},
            component: <span></span>,
          },
        ],
      },
      {
        type: 'Section',
        title: t('Migration readiness'),
        wizardTitle: t('Migration readiness'),
        inputs: [
          {
            id: 'migration-readiness',
            type: 'Custom',
            value: {},
            component: <span></span>,
          },
        ],
      },
    ],
    stateToData: () => [
      {
        apiVersion: 'migration.io/v1beta1',
        kind: 'VirtualMachineMigration',
        metadata: {
          name: 'vm-migration-sample',
          namespace: 'default',
        },
        spec: {
          targetCluster: 'cluster-b',
          validateBeforeMigration: true,
          dryRun: false,
        },
      },
    ],
    submit: () => {
      console.log('Submit migration plan')
    },
    submitText: t('Migrate'),
    submittingText: t('Migrating'),
    reviewTitle: t('Review your migration plan'),
    reviewDescription: t('Ensure all fields are correct before proceeding.'),
    cancelLabel: t('Cancel'),
    nextLabel: t('Next'),
    backLabel: t('Back'),
    back: () => NavigationPath.virtualizationManagement,
    cancel: () => NavigationPath.virtualizationManagement,
  }

  return (
    <AcmDataFormPage
      formData={formData}
      mode="wizard"
      hideYaml={false}
      secrets={[]}
      immutables={[]}
      editorTitle={t('Migration YAML')}
    />
  )
}
