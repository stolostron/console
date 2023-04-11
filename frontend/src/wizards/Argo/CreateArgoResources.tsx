/* Copyright Contributors to the Open Cluster Management project */

import { AcmDataFormPage } from '../../components/AcmDataForm'
import { FormData } from '../../components/AcmFormData'
import { useTranslation } from '../../lib/acm-i18next'
import { GitOpsClusterApiVersion, GitOpsClusterKind, PlacementApiVersionBeta, PlacementKind } from '../../resources'
import schema from './schema.json'

export interface ICreateArgoResourcesModalProps {
  handleModalToggle?: () => void
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
          //   {
          //     id: 'disable-alert',
          //     type: 'Alert',
          //     label: '',
          //     labelHelpTitle: t('Credential name and namespace are predefined as below for HyperShift add-on'),
          //     variant: 'info',
          //     reactNode: (
          //       <Fragment>
          //         <a href={DOC_LINKS.HYPERSHIFT_OIDC} target="_blank" rel="noreferrer">
          //           {t('Learn more')}
          //         </a>
          //       </Fragment>
          //     ),
          //     value: '',
          //     onChange: () => {},
          //     isHidden: false,
          //   },
          {
            id: 'test',
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
    submitText: 'Submit',
    submittingText: 'Submitting',
    reviewTitle: 'Review',
    reviewDescription: 'Review description',
    nextLabel: 'Next',
    backLabel: 'Back',
    cancelLabel: 'Cancel',
    cancel: () => {},
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
