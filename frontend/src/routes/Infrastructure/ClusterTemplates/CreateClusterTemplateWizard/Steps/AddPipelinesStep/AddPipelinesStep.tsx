/* Copyright Contributors to the Open Cluster Management project */
import { Button, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import { useHistory } from 'react-router-dom';
import PipelinesTable from './PipelinesTable';

const AddPipelinesStep = () => {
  const history = useHistory();

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Stack hasGutter>
            <StackItem>
              <Text component="h2">Add pipelines (optional)</Text>
            </StackItem>
            <StackItem>
              Pipelines can be used to run a post-installation configuration of your cluster, such
              as installing additional software. Once this template is used to create a cluster, the
              cluster will not be made available until all pipelines have been executed
              successfully.
            </StackItem>
            <StackItem>
              Choose on or more of the existing pipelines from the list below, that will be part of
              the cluster template. You can add more pipelines using the{' '}
              <Button
                isInline
                variant="link"
                onClick={() =>
                  history.push('/k8s/ns/cluster-pipelines/tekton.dev~v1beta1~Pipeline/~new/builder')
                }
              >
                Pipeline builder
              </Button>
              .
            </StackItem>
          </Stack>
        </TextContent>
      </StackItem>
      <StackItem>
        <PipelinesTable />
      </StackItem>
    </Stack>
  );
};

export default AddPipelinesStep;
