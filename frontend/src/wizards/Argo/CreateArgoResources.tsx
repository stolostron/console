/* Copyright Contributors to the Open Cluster Management project */

import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { useTranslation } from '../../lib/acm-i18next'
import { GitOpsClusterApiVersion, GitOpsClusterKind, PlacementApiVersionBeta, PlacementKind } from '../../resources'
import schema from './schema.json'

export interface ICreateArgoResourcesModalProps {
  handleModalToggle: () => void
}

function stateToData() {
  const data = {}
  return data
}

export function CreateArgoResources(props: ICreateArgoResourcesModalProps) {
  const { t } = useTranslation()
  const { handleModalToggle } = props

  const formData: FormData = {
    title: t('Add Argo Server'),
    titleTooltip: 'Title tooltip',
    description: t('To configure Gitops, please follow the steps below.'),
    breadcrumb: [{ text: 'Title' }],
    sections: [
      {
        type: 'Section',
        title: t('GitOpsCluster'),
        wizardTitle: t('GitOpsCluster'),
        description: t(
          'This enables the Red Hat OpenShift Container Platform GitOps instance to deploy applications to any of those Red Hat Advanced Cluster Management managed clusters.'
        ),
        inputs: [
          {
            id: 'create-gitops',
            type: 'Yaml',
            label: '',
            resource: {
              kind: GitOpsClusterKind,
              apiVersion: GitOpsClusterApiVersion,
              metadata: {
                name: 'gitops-cluster',
                namespace: 'openshift-gitops',
              },
              spec: {
                argoServer: {
                  argoNamespace: 'openshift-gitops',
                  cluster: 'local-cluster',
                },
                placementRef: {
                  apiVersion: PlacementApiVersionBeta,
                  kind: PlacementKind,
                  name: 'gitops-placement',
                },
              },
            },
            value: '',
            onChange: () => {},
          },
        ],
      },
    ],
    submit: () => {},
    submitText: t('Add'),
    submittingText: t('Adding'),
    reviewTitle: 'Review',
    reviewDescription: 'Review description',
    nextLabel: t('Next'),
    backLabel: t('Back'),
    cancelLabel: t('Cancel'),
    cancel: handleModalToggle,
    stateToData,
  }

  return (
    <AcmDataFormPage
      formData={formData}
      //   editorTitle={t('Credentials YAML')}
      hideYaml={true}
      schema={schema}
      mode={'wizard'}
      isModalWizard={!!handleModalToggle}
    />
  )
}
