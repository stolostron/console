/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterCurator,
  ClusterCuratorDefinition,
  createClusterCurator,
  createResource,
  IResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
  SecretDefinition,
  ClusterCuratorKind,
} from '../../../../../resources'
import { makeStyles } from '@mui/styles'
import {
  AcmAlert,
  AcmButton,
  AcmEmptyState,
  AcmForm,
  AcmModal,
  AcmSelect,
  AcmTable,
  IAcmTableColumn,
} from '../../../../../ui-components'
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  ModalVariant,
  SelectOption,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { useClusterDistributionColumn, useClusterProviderColumn } from '../ManagedClusters'
import { NavigationPath } from '../../../../../NavigationPath'
import { cloneDeep } from 'lodash'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useSharedAtoms, useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'

const useStyles = makeStyles({
  body: {},
  select: {
    '& > div': {
      alignItems: 'end',
      '& > div:last-child': {
        paddingBottom: '6px',
      },
    },
  },
  table: {
    '& .pf-c-toolbar': {
      display: 'none',
    },
  },
})

export function UpdateAutomationModal(props: {
  close: () => void
  open: boolean
  clusters: Cluster[] | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const classes = useStyles()
  const { clusterCuratorsState, hostedClustersState } = useSharedAtoms()
  const { ansibleCredentialsValue, clusterCuratorSupportedCurationsValue, validClusterCuratorTemplatesValue } =
    useSharedSelectors()
  const validCuratorTemplates = useRecoilValue(validClusterCuratorTemplatesValue)
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const ansibleCredentials = useRecoilValue(ansibleCredentialsValue)
  const [selectedCuratorTemplate, setSelectedCuratorTemplate] = useState<ClusterCurator | undefined>()
  const [isUpdating, setIsUpdating] = useState(false)
  const clusterProviders = useClusterProviderColumn()
  const distributionVersion = useClusterDistributionColumn(clusterCurators, hostedClusters)

  const handleCuratorSelect = (uid: string | undefined) => {
    setSelectedCuratorTemplate(
      !uid ? undefined : validCuratorTemplates.find((template) => template.metadata.uid === uid)
    )
  }

  const isUpdatable = (cluster: Cluster) => {
    return clusterSupportsAction(cluster, ClusterAction.UpdateAutomationTemplate)
  }

  const updatableClusters = useMemo<Cluster[] | undefined>(
    () => props.clusters && props.clusters.filter(isUpdatable),
    [props.clusters]
  )

  const addAutomationTemplateColumns = useMemo<IAcmTableColumn<Cluster>[]>(
    () => [
      {
        header: t('Name'),
        cell: (cluster: Cluster) => cluster.name,
        sort: 'cluster.name',
      },
      clusterProviders,
      distributionVersion,
    ],
    [t, clusterProviders, distributionVersion]
  )

  const onConfirm = async () => {
    if (selectedCuratorTemplate === undefined) {
      return
    }
    setIsUpdating(true)

    // Set up resources to patch and/or create
    const resources: {
      resource: IResource
      data: any
    }[] = []

    const curatorPatch = {
      spec: cloneDeep(selectedCuratorTemplate.spec),
    }

    resources.push({
      resource: { ...ClusterCuratorDefinition },
      data: curatorPatch,
    })

    // Collect Ansible secrets for each supported curation type
    supportedCurations.forEach((curationType) => {
      const curation = curatorPatch.spec?.[curationType]
      if (curation?.towerAuthSecret) {
        const matchingSecret = ansibleCredentials.find(
          (s) =>
            s.metadata.name === curatorPatch.spec?.[curationType]?.towerAuthSecret &&
            s.metadata.namespace === selectedCuratorTemplate.metadata.namespace
        )
        if (matchingSecret && matchingSecret.metadata.name && matchingSecret.metadata.namespace) {
          const secretName = `toweraccess-${curationType}`
          const copiedSecret = {
            ...SecretDefinition,
            type: 'Opaque',
            metadata: {
              name: secretName,
            },
          }
          const copiedSecretSpec = {
            metadata: {
              labels: {
                'cluster.open-cluster-management.io/type': 'ans',
                'cluster.open-cluster-management.io/copiedFromSecretName': matchingSecret.metadata.name,
                'cluster.open-cluster-management.io/copiedFromNamespace': matchingSecret.metadata.namespace,
                'cluster.open-cluster-management.io/backup': 'cluster',
              },
            },
            stringData: cloneDeep(matchingSecret.stringData),
          }
          curation.towerAuthSecret = secretName
          resources.push({
            resource: copiedSecret,
            data: copiedSecretSpec,
          })
        }
      }
    })

    const results: IRequestResult[] = []
    updatableClusters &&
      updatableClusters.forEach((cluster) => {
        resources.forEach((resource) => {
          const resourceCopy = {
            ...resource.resource,
            metadata: {
              ...(resource.resource.metadata || {}),
              ...(resource.resource.kind === ClusterCuratorKind ? { name: cluster.name } : {}), // For curator, override name per cluster
              namespace: cluster.name, // For curator and secrets, override namespace per cluster
            },
          }

          const result = patchResource(resourceCopy, resource.data)
          let createResult: IRequestResult | undefined = undefined

          results.push({
            promise: new Promise((resolve, reject) => {
              result.promise
                .then((data) => {
                  return resolve(data)
                })
                .catch((err: ResourceError) => {
                  if (err.code === ResourceErrorCode.NotFound) {
                    const combinedResource = {
                      ...resourceCopy,
                      ...resource.data,
                      // for Secrets, need to preserve metadata from both resources for name/namespace and labels
                      metadata: { ...(resource.data.metadata || {}), ...resourceCopy.metadata },
                    }
                    createResult =
                      resourceCopy.kind === ClusterCuratorKind
                        ? createClusterCurator(combinedResource as ClusterCurator)
                        : createResource(combinedResource)
                    createResult.promise.then((data) => resolve(data)).catch((err) => reject(err))
                  } else {
                    reject(err)
                  }
                  setIsUpdating(false)
                })
            }),
            abort: () => {
              result.abort()
              if (createResult) {
                createResult.abort()
              }
              setIsUpdating(false)
            },
          })
        })
      })
    await Promise.allSettled(results.map((result) => result.promise))
    setSelectedCuratorTemplate(undefined)
    setIsUpdating(false)
    props.close()
  }

  const nonUpdatableCount = props.clusters && updatableClusters && props.clusters.length - updatableClusters.length

  return (
    <AcmModal
      title={t('Update automation template')}
      isOpen={props.open}
      variant={ModalVariant.small}
      onClose={() => {
        setSelectedCuratorTemplate(undefined)
        props.close()
      }}
      actions={[
        <Button
          key="confirm"
          id="confirm"
          variant="primary"
          onClick={onConfirm}
          isAriaDisabled={selectedCuratorTemplate === undefined || updatableClusters?.length === 0}
        >
          {isUpdating ? t('Saving') : t('save')}
        </Button>,
        <Button
          key="cancel"
          id="cancel"
          variant="link"
          onClick={() => {
            props.close()
            setSelectedCuratorTemplate(undefined)
          }}
        >
          {t('Cancel')}
        </Button>,
      ]}
    >
      <AcmForm>
        <Stack hasGutter>
          {nonUpdatableCount !== 0 && (
            <StackItem>
              <AcmAlert
                variant="warning"
                title={t('{{count}} cluster cannot be edited ', { count: nonUpdatableCount })}
                message={t(
                  'Automation is only supported for Red Hat OpenShift clusters that are not provisioned by a managed Kubernetes service. The automation template can be updated only for ready clusters that do not have an upgrade in progress.'
                )}
                isInline
                noClose
              />
            </StackItem>
          )}
          <StackItem>{t('Update the automation template for the selected clusters.')}</StackItem>
          <StackItem className={classes.select}>
            <Flex>
              <FlexItem flex={{ default: 'flex_1' }}>
                <AcmSelect
                  id="curator-templates"
                  label={t('New template')}
                  maxHeight="12em"
                  menuAppendTo="parent"
                  onChange={(key) => handleCuratorSelect(key)}
                  value={selectedCuratorTemplate?.metadata.uid}
                  placeholder={t('Select a template')}
                >
                  {validCuratorTemplates.map((templates) => (
                    <SelectOption key={templates.metadata.uid} value={templates.metadata.uid}>
                      {templates.metadata.name}
                    </SelectOption>
                  ))}
                </AcmSelect>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <AcmButton
                  id="view-selected"
                  isDisabled={!selectedCuratorTemplate}
                  target="_blank"
                  isInline
                  variant={ButtonVariant.link}
                  component={Link}
                  to={{
                    pathname:
                      selectedCuratorTemplate &&
                      selectedCuratorTemplate.metadata.namespace &&
                      selectedCuratorTemplate.metadata.name
                        ? NavigationPath.editAnsibleAutomation
                            .replace(':namespace', selectedCuratorTemplate.metadata.namespace as string)
                            .replace(':name', selectedCuratorTemplate.metadata.name as string)
                        : undefined,
                    state: {
                      from: NavigationPath.managedClusters,
                    },
                  }}
                >
                  {t('View selected template')}
                  <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
                </AcmButton>
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem className={classes.table}>
            <AcmTable<Cluster>
              columns={addAutomationTemplateColumns}
              items={updatableClusters}
              emptyState={
                <AcmEmptyState
                  title={t('No clusters available')}
                  message={t('The automation template cannot be updated for any of the selected clusters.')}
                />
              }
              keyFn={(c: Cluster) => c.name as string}
              autoHidePagination={true}
            />
          </StackItem>
        </Stack>
      </AcmForm>
    </AcmModal>
  )
}
