/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react';
import { Form, Stack, StackItem, Text, TextContent, TextInputTypes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { InputField, NumberSpinnerField } from 'formik-pf';
import { SelectField } from 'openshift-assisted-ui-lib/cim';
import { useHelmRepositories } from '../../../hooks/useHelmRepositories';
import { useHelmRepositoryIndex, getRepoCharts } from '../../../hooks/useHelmRepositoryIndex';
import { FormikValues } from '../../types';

const TemplateDetailsStep = () => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const [repositories, loaded] = useHelmRepositories();
  const [repoIndex, indexLoaded] = useHelmRepositoryIndex();

  React.useEffect(() => {
    if (loaded && repositories[0]?.metadata?.name && !values.helmRepo) {
      setFieldValue('helmRepo', repositories[0].metadata?.name);
    }
  }, [loaded, repositories, values.helmRepo, setFieldValue]);

  const repoOptions = repositories.map((r) => ({
    value: r.metadata?.name || '',
    label: r.metadata?.name || '',
  }));
  const chartsFromRepo = repoIndex ? getRepoCharts(repoIndex, values.helmRepo) : [];

  const firstChart = chartsFromRepo[0]?.name;

  React.useEffect(() => {
    if (indexLoaded && values.helmRepo && !values.helmChart) {
      setFieldValue('helmChart', firstChart);
    }
  }, [indexLoaded, values.helmRepo, values.helmChart, firstChart, setFieldValue]);

  const chartOptions = chartsFromRepo.map((c) => ({ value: c.name, label: c.name }));

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h2">Template details</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Form>
          <InputField
            fieldId="name"
            isRequired
            name="name"
            label="Template name"
            type={TextInputTypes.text}
            placeholder="Enter template name"
          />
          <SelectField name="helmRepo" options={repoOptions} isRequired label="Helm repository" />
          <SelectField
            name="helmChart"
            options={chartOptions}
            isRequired
            label="Helm chart"
            isDisabled={!values.helmRepo}
          />
          <NumberSpinnerField isRequired fieldId="cost" name="cost" min={1} label="Cost" />
        </Form>
      </StackItem>
    </Stack>
  );
};

export default TemplateDetailsStep;
