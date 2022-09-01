/* Copyright Contributors to the Open Cluster Management project */
import {
  Stack,
  StackItem,
  TextContent,
  Text,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { FormikValues } from '../../types';

const ReviewStep = () => {
  const { values } = useFormikContext<FormikValues>();
  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h2">Review</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>{values.name}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>HELM chart repository</DescriptionListTerm>
            <DescriptionListDescription>{values.helmRepo}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>HELM chart</DescriptionListTerm>
            <DescriptionListDescription>{values.helmChart}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Cost</DescriptionListTerm>
            <DescriptionListDescription>{values.cost}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Pipelines</DescriptionListTerm>
            {values.pipelines.map((p) => (
              <DescriptionListDescription key={p}>{p}</DescriptionListDescription>
            ))}
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

export default ReviewStep;
