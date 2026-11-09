/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
  List,
  ListItem,
  PageSection,
  SelectOption,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { generatePath, Link } from 'react-router'
import { RbacDropdown } from '~/components/Rbac'
import { useTranslation } from '~/lib/acm-i18next'
import { rbacDelete } from '~/lib/rbac-util'
import { NavigationPath } from '~/NavigationPath'
import type { GitOpsCluster } from '~/resources/gitops-cluster'
import { GitopsClusterDefinition } from '~/resources/gitops-cluster'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { AcmEmptyState, AcmPageContent, AcmSelect } from '~/ui-components'
import { DeleteGitOpsClusterModal } from '~/routes/Infrastructure/Clusters/GitOps/DeleteGitOpsClusterModal'
import { getGitOpsClusterNames } from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterStatus'
import { ViewDocumentationLink, DOC_LINKS } from '~/lib/doc-util'

const resourceKey = (resource: GitOpsCluster) => `${resource.metadata.namespace}/${resource.metadata.name}`

function getAgentModeLabel(mode: string, t: (key: string) => string) {
  if (mode === 'autonomous') {
    return t('Autonomous')
  }
  if (mode === 'managed') {
    return t('Managed')
  }
  return mode
}

export default function GitOps() {
  const { t } = useTranslation()
  const { gitOpsClustersState } = useSharedAtoms()
  const resources = useSharedValue(gitOpsClustersState)
  const [selectedKey, setSelectedKey] = useState('')
  const [deleting, setDeleting] = useState<GitOpsCluster>()
  const selected =
    resources.find((resource) => resourceKey(resource) === selectedKey) ??
    (resources.length === 1 ? resources[0] : undefined)
  const closeDelete = () => setDeleting(undefined)
  const onSelectResource = (value: string | undefined) => setSelectedKey(value ?? '')

  return (
    <AcmPageContent id="gitops">
      <PageSection hasBodyWrapper={false}>
        {resources.length === 0 ? (
          <AcmEmptyState
            title={t('No GitOps configuration set up')}
            message={t(
              'Create a GitOpsCluster resource to connect managed clusters to GitOps and enable ApplicationSets deployment across your fleet.'
            )}
            action={<ViewDocumentationLink doclink={DOC_LINKS.GITOPS_CLUSTER_AGENT_PULL} />}
          />
        ) : (
          <Stack hasGutter>
            {resources.length > 1 && (
              <StackItem>
                <Alert
                  isInline
                  variant="warning"
                  title={t('Only one GitOpsCluster is supported. Select an existing resource to view or delete it.')}
                />
              </StackItem>
            )}
            {resources.length > 1 && (
              <StackItem>
                <AcmSelect
                  id="gitops-configuration"
                  label={t('GitOps configuration')}
                  placeholder={t('Select a GitOps configuration')}
                  value={selected ? resourceKey(selected) : undefined}
                  onChange={onSelectResource}
                >
                  {resources.map((resource) => (
                    <SelectOption key={resourceKey(resource)} value={resourceKey(resource)}>
                      {resourceKey(resource)}
                    </SelectOption>
                  ))}
                </AcmSelect>
              </StackItem>
            )}
            {selected && (
              <StackItem>
                <GitOpsOverview resource={selected} onDelete={setDeleting} />
              </StackItem>
            )}
          </Stack>
        )}
        {deleting && <DeleteGitOpsClusterModal resource={deleting} onClose={closeDelete} />}
      </PageSection>
    </AcmPageContent>
  )
}

function GitOpsOverview({
  resource,
  onDelete,
}: Readonly<{
  resource: GitOpsCluster
  onDelete: (resource: GitOpsCluster) => void
}>) {
  const { t } = useTranslation()
  const { placementsState, managedClusterSetBindingsState } = useSharedAtoms()
  const placements = useSharedValue(placementsState)
  const bindings = useSharedValue(managedClusterSetBindingsState)
  const placementName = resource.spec?.placementRef?.name
  const placement = placements.find(
    (item) => item.metadata.namespace === resource.metadata.namespace && item.metadata.name === placementName
  )
  const relatedBindings = bindings.filter(
    (binding) =>
      binding.metadata.namespace === resource.metadata.namespace &&
      !!placement &&
      (!placement.spec.clusterSets?.length || placement.spec.clusterSets.includes(binding.spec.clusterSet))
  )
  const names = getGitOpsClusterNames(resource.status)
  const agentEnabled =
    resource.spec?.gitopsAddon?.enabled === true && resource.spec?.gitopsAddon?.argoCDAgent?.enabled === true
  const agentMode = resource.spec?.gitopsAddon?.argoCDAgent?.mode ?? 'managed'
  const agentModeLabel = getAgentModeLabel(agentMode, t)
  const actions = [
    {
      id: 'delete-gitops',
      text: t('Delete'),
      isAriaDisabled: true,
      click: onDelete,
      rbac: [rbacDelete(GitopsClusterDefinition, resource.metadata.namespace, resource.metadata.name)],
    },
  ]

  return (
    <Stack hasGutter>
      <StackItem>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
        >
          <FlexItem>
            <Title headingLevel="h2">{resource.metadata.name}</Title>
          </FlexItem>
          <FlexItem>
            <RbacDropdown
              key={resourceKey(resource)}
              id="gitops-actions"
              item={resource}
              isKebab={false}
              text={t('Actions')}
              actions={actions}
            />
          </FlexItem>
        </Flex>
        <Content component="p">
          {t(
            'The GitOpsCluster resource connects OpenShift GitOps on the hub to selected managed clusters and defines the active pull model for new pull-based ApplicationSets.'
          )}
        </Content>
      </StackItem>
      <StackItem>
        <Grid hasGutter>
          <GridItem span={12} md={6}>
            <Card isFullHeight>
              <CardTitle component="h3">{t('Details')}</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                    <DescriptionListDescription>{resource.metadata.name}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Namespace')}</DescriptionListTerm>
                    <DescriptionListDescription>{resource.metadata.namespace}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Placement')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {placementName ? (
                        <Link
                          to={generatePath(NavigationPath.placementOverview, {
                            namespace: resource.metadata.namespace!,
                            name: placementName,
                          })}
                        >
                          {placementName}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('ManagedClusterSetBindings')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {relatedBindings.length > 0 ? (
                        <List isPlain>
                          {relatedBindings.map((binding) => (
                            <ListItem key={binding.metadata.name}>{binding.metadata.name}</ListItem>
                          ))}
                        </List>
                      ) : (
                        '-'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Selected clusters')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {names === undefined ? '-' : <GitOpsClusterLinks names={names} />}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={12} md={6}>
            <Card isFullHeight>
              <CardTitle component="h3">{t('Pull model configuration')}</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <DescriptionList isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Argo CD Agent')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label color={agentEnabled ? 'green' : 'grey'}>
                            {agentEnabled ? t('Enabled') : t('Disabled')}
                          </Label>
                          {agentEnabled && <Label color="green">{agentModeLabel}</Label>}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </StackItem>
                  <StackItem>
                    <Content component="p">
                      {agentEnabled
                        ? t(
                            'Argo CD Agent uses direct gRPC connections between managed clusters and OpenShift GitOps on the hub.'
                          )
                        : t(
                            'Argo CD Agent is disabled. Managed clusters do not use direct agent gRPC connections for this GitOpsCluster.'
                          )}
                    </Content>
                  </StackItem>
                  {agentEnabled && (
                    <StackItem>
                      <Alert
                        isInline
                        variant="info"
                        title={t('Argo CD ManifestWork pull is disabled while Argo CD Agent is active.')}
                      />
                    </StackItem>
                  )}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  )
}

function GitOpsClusterLinks({ names }: Readonly<{ names: string[] }>) {
  const { t } = useTranslation()
  return names.length > 0 ? (
    <List isPlain>
      {names.map((name) => (
        <ListItem key={name}>
          <Link to={generatePath(NavigationPath.clusterOverview, { namespace: name, name })}>{name}</Link>
        </ListItem>
      ))}
    </List>
  ) : (
    <>{t('None')}</>
  )
}
