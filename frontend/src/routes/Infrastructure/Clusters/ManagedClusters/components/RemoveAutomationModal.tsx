/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterCuratorDefinition,
  IResource,
  IRequestResult,
  ResourceError,
  SecretDefinition,
  ClusterCuratorKind,
  deleteResource,
  isAutomationTemplate,
} from '../../../../../resources'
import { makeStyles } from '@mui/styles'
import { AcmEmptyState, AcmForm, AcmModal, AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { Button, ButtonVariant, ModalVariant, Stack, StackItem } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useClusterDistributionColumn, useClusterProviderColumn } from '../ManagedClusters'
import { useSharedAtoms, useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'

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

export function RemoveAutomationModal(props: {
  close: () => void
  open: boolean
  clusters: Cluster[] | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const classes = useStyles()
  const { clusterCuratorsState, hostedClustersState } = useSharedAtoms()
  const { clusterCuratorSupportedCurationsValue } = useSharedSelectors()
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const [isRemoving, setIsRemoving] = useState(false)
  const clusterProviders = useClusterProviderColumn()
  const distributionVersion = useClusterDistributionColumn(clusterCurators, hostedClusters)

  const removableClusters = useMemo<Cluster[] | undefined>(
    () =>
      props.clusters &&
      props.clusters.filter(({ name }) =>
        clusterCurators.find(
          (cc) => name === cc.metadata.name && name === cc.metadata.namespace && isAutomationTemplate(cc)
        )
      ),
    [props.clusters, clusterCurators]
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
    setIsRemoving(true)

    // for every cluster that has a curator, get its clusterCurator
    const results: IRequestResult[] = []
    removableClusters?.forEach((cluster) => {
      const clusterCurator = clusterCurators.find(
        ({ metadata }) => cluster.name === metadata.name && cluster.name === metadata.namespace
      )
      if (clusterCurator) {
        // Set up resources to patch/remove
        const resources: {
          resource: IResource
          data?: any
        }[] = []

        // delete curator
        resources.push({
          resource: { ...ClusterCuratorDefinition },
        })

        // delete secrets
        supportedCurations.forEach((curationType) => {
          const curation = clusterCurator.spec?.[curationType]
          if (curation?.towerAuthSecret) {
            const deleteSecret = {
              ...SecretDefinition,
              type: 'Opaque',
              metadata: {
                name: `toweraccess-${curationType}`,
              },
            }
            resources.push({
              resource: deleteSecret,
            })
          }
        })

        // delete resources
        resources.forEach((resource) => {
          const resourceCopy = {
            ...resource.resource,
            metadata: {
              ...(resource.resource.metadata || {}),
              ...(resource.resource.kind === ClusterCuratorKind ? { name: cluster.name } : {}), // For curator, override name per cluster
              namespace: cluster.name, // For curator and secrets, override namespace per cluster
            },
          }
          const result = deleteResource(resourceCopy)
          results.push({
            promise: new Promise((resolve, reject) => {
              result.promise
                .then((data) => {
                  return resolve(data)
                })
                .catch((err: ResourceError) => {
                  reject(err)
                  setIsRemoving(false)
                })
            }),
            abort: () => {
              result.abort()
              setIsRemoving(false)
            },
          })
        })
      }
    })
    await Promise.allSettled(results.map((result) => result.promise))
    setIsRemoving(false)
    props.close()
  }

  return (
    <AcmModal
      title={t('Remove automation template')}
      titleIconVariant={'warning'}
      isOpen={props.open}
      variant={ModalVariant.small}
      onClose={() => {
        props.close()
      }}
      actions={[
        <Button
          key="confirm"
          id="confirm"
          variant={ButtonVariant.danger}
          onClick={onConfirm}
          isAriaDisabled={removableClusters?.length === 0}
        >
          {isRemoving ? t('Removing') : t('Remove')}
        </Button>,
        <Button
          key="cancel"
          id="cancel"
          variant="link"
          onClick={() => {
            props.close()
          }}
        >
          {t('Cancel')}
        </Button>,
      ]}
    >
      <AcmForm>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This action removes the automation template from the following list of clusters. Only clusters that have an automation template are listed.'
            )}
          </StackItem>
          <StackItem className={classes.table}>
            <AcmTable<Cluster>
              columns={addAutomationTemplateColumns}
              items={removableClusters}
              emptyState={
                <AcmEmptyState
                  title={t('No clusters available')}
                  message={t('None of the selected clusters has a template.')}
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
