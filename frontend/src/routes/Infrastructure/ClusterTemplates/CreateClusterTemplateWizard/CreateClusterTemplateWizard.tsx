/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import { k8sCreate, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Wizard, WizardContext, WizardFooter } from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import { clusterTemplateGVK } from '../constants';
import { ClusterTemplate } from '../types';
import ManageAccessStep from './Steps/ManageAccessStep/ManageAccessStep';
import ReviewStep from './Steps/ReviewStep/ReviewStep';
import TemplateDetailsStep from './Steps/TemplateDetailsStep/TemplateDetailsStep';
import { FormikValues } from './types';
import { useHistory } from 'react-router-dom';

const CustomFooter = () => {
  const history = useHistory();
  const { submitForm } = useFormikContext();
  const { activeStep, onNext, onBack } = React.useContext(WizardContext);
  return (
    <WizardFooter>
      <Button
        variant="primary"
        type="submit"
        onClick={activeStep.name === 'Review' ? submitForm : onNext}
      >
        {activeStep.name === 'Review' ? 'Create' : 'Next'}
      </Button>
      <Button
        variant="secondary"
        onClick={onBack}
        isDisabled={activeStep.name === 'Template details'}
      >
        Back
      </Button>
      <Button variant="link" onClick={history.goBack}>
        Cancel
      </Button>
    </WizardFooter>
  );
};

const CreateClusterTemplateWizard = () => {
  const history = useHistory();
  const [model] = useK8sModel(clusterTemplateGVK);
  const steps = [
    { name: 'Template details', component: <TemplateDetailsStep /> },
    { name: 'Manage access', component: <ManageAccessStep /> },
    { name: 'Review', component: <ReviewStep /> },
  ];
  const title = 'Create cluster template';

  return (
    <Formik<FormikValues>
      initialValues={{
        name: '',
        helmRepo: '',
        helmChart: '',
        cost: 1,
        quotaNamespace: '',
        quotaCount: 1,
        quotaName: '',
        pipelines: [],
      }}
      onSubmit={async (values) => {
        await k8sCreate<ClusterTemplate>({
          model,
          data: {
            apiVersion: 'clustertemplate.openshift.io/v1alpha1',
            kind: 'ClusterTemplate',
            metadata: {
              name: values.name,
            },
            spec: {
              cost: values.cost,
              clusterDefinition: {
                applicationSpec: {
                  source: {
                    repoURL: values.helmRepo,
                    chart: values.helmChart,
                  },
                },
              },
            },
          },
        });
        history.push('/multicloud/infrastructure/templates');
      }}
    >
      <Wizard
        title={title}
        navAriaLabel={`${title} steps`}
        mainAriaLabel={`${title} content`}
        steps={steps}
        footer={<CustomFooter />}
        hideClose
      />
    </Formik>
  );
};

export default CreateClusterTemplateWizard;
