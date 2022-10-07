/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import { k8sCreate, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import {
  Form,
  Button,
  TextInputTypes,
  Alert,
  ActionGroup,
  PageSection,
  Grid,
  GridItem,
  TextContent,
  Text,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { InputField } from 'formik-pf';
import { useHistory } from 'react-router-dom';
import { helmRepoGVK, TEMPLATES_HELM_REPO_LABEL } from '../constants';

const HelmRepositoryForm = () => {
  const [error, setError] = React.useState();
  const [model] = useK8sModel(helmRepoGVK);
  const history = useHistory();
  return (
    <>
      <PageSection>
        <TextContent>
          <Text component="h1">Create HELM Repository</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <Grid>
          <GridItem span={6}>
            <Formik
              initialValues={{ name: '', url: '' }}
              onSubmit={async (values) => {
                setError(undefined);
                try {
                  await k8sCreate({
                    model,
                    data: {
                      apiVersion: 'helm.openshift.io/v1beta1',
                      kind: 'HelmChartRepository',
                      metadata: {
                        name: values.name,
                        labels: {
                          [TEMPLATES_HELM_REPO_LABEL]: 'true',
                        },
                      },
                      spec: {
                        connectionConfig: {
                          url: values.url,
                        },
                      },
                    },
                  });
                  history.goBack();
                } catch (e) {
                  setError(e as any);
                }
              }}
            >
              {({ handleSubmit }) => (
                <Form onSubmit={handleSubmit}>
                  <InputField
                    fieldId="name"
                    isRequired
                    name="name"
                    label="Name"
                    type={TextInputTypes.text}
                    placeholder="Enter your name"
                  />
                  <InputField
                    fieldId="url"
                    isRequired
                    name="url"
                    label="URL"
                    type={TextInputTypes.text}
                    placeholder="Repository URL"
                  />
                  {error && <Alert title="error" />}
                  <ActionGroup>
                    <Button type="submit">Create</Button>
                    <Button variant="link" onClick={history.goBack}>
                      Cancel
                    </Button>
                  </ActionGroup>
                </Form>
              )}
            </Formik>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default HelmRepositoryForm;
