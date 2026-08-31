/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCuratorDefinition, IResource, SecretDefinition, isAutomationTemplate } from '../../../../../resources'
import { Cluster, IRequestResult, ResourceError, deleteResource } from '../../../../../resources/utils'
import { css } from '@emotion/css'
import { AcmEmptyState, AcmForm, AcmModal, AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { Button, ButtonVariant, Stack, StackItem } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { useMemo, useState, JSX } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useSharedAtoms, useRecoilValue, useSharedSelectors } from '../../../../../shared-recoil'
import { useClusterDistributionColumn, useClusterProviderColumn } from '../../../../../components/Clusters'
import { automationCuratorNamespace } from '../utils/cluster-actions'

const table = css({
  '& .pf-v6-c-toolbar': {
    display: 'none',
  },
})

export function RemoveAutomationModal(props: {
  close: () => void
  open: boolean
  clusters: Cluster[] | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { clusterCuratorsState, hostedClustersState } = useSharedAtoms()
  const { clusterCuratorSupportedCurationsValue } = useSharedSelectors()
  const clusterCurators = useRecoilValue(clusterCuratorsState)
  const hostedClusters = useRecoilValue(hostedClustersState)
  const supportedCurations = useRecoilValue(clusterCuratorSupportedCurationsValue)
  const [isRemoving, setIsRemoving] = useState(false)
  const clusterProviders = useClusterProviderColumn()
  const distributionVersion = useClusterDistributionColumn(props.clusters, clusterCurators, hostedClusters)

  const removableClusters = useMemo<Cluster[] | undefined>(
    () =>
      props.clusters &&
      props.clusters.filter((cluster) =>
        clusterCurators.find(
          (cc) =>
            cluster.name === cc.metadata.name &&
            automationCuratorNamespace(cluster) === cc.metadata.namespace &&
            isAutomationTemplate(cc)
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

    // for all clusters selected in the modal:
    //   - remove its ClusterCurator (which determines what Ansible automation template to run for this cluster)
    const results: IRequestResult[] = []
    removableClusters?.forEach((cluster) => {
      // hive clusters have a namespace that equals its name
      // hosted clusters also have a hive cluster (namespace===name) but they also have a
      //    "Hosted cluster namespace" specified when created that will contain other resources related
      //    to that cluster, including:
      //    - ClusterCurator: which defines what Ansible automation jobs to run when installing/updating that cluster
      //    - toweraccess-* Secrets: which contain the credentials for the Ansible Tower server to use when running the automation jobs

      // get the shared namespace from the hosted cluster
      // this is where the ClusterCurator lives (default is 'clusters')
      const curatorNamespace = automationCuratorNamespace(cluster)

      // find the ClusterCurator for this cluster
      const clusterCurator = clusterCurators.find(
        ({ metadata }) => cluster.name === metadata.name && curatorNamespace === metadata.namespace
      )
      if (clusterCurator) {
        // Set up resources to patch/remove
        const resources: {
          resource: IResource
          data?: any
        }[] = []

        // delete curator
        resources.push({
          resource: { ...ClusterCuratorDefinition, metadata: { name: cluster.name, namespace: curatorNamespace } },
        })

        // delete secrets, using the actual Secret name referenced by the curator so the
        // differentiated name (ACM-39253) used for shared-namespace clusters is respected
        supportedCurations.forEach((curationType) => {
          const curation = clusterCurator.spec?.[curationType]
          if (curation?.towerAuthSecret) {
            const deleteSecret = {
              ...SecretDefinition,
              type: 'Opaque',
              metadata: {
                name: curation.towerAuthSecret,
                namespace: curatorNamespace,
              },
            }
            resources.push({
              resource: deleteSecret,
            })
          }
        })

        // delete resources
        resources.forEach((resource) => {
          const result = deleteResource(resource.resource)
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
      variant={ModalVariant.medium}
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
          <StackItem className={table}>
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
