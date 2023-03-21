/* Copyright Contributors to the Open Cluster Management project */

import { AcmEmptyState, AcmSelect } from '../../../../../ui-components'
import { SelectOption, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { BulkActionModal } from '../../../../../components/BulkActionModal'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  Cluster,
  ClusterCurator,
  ClusterCuratorDefinition,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources'
import { ReleaseNotesLink } from './ReleaseNotesLink'
import './style.css'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'

// compare version
const compareVersion = (a: string, b: string) => {
  // basic sort semvers without preversion
  const aVersion = a.split('.')
  const bVersion = b.split('.')
  for (let i = 0; i < Math.min(aVersion.length, bVersion.length); i++) {
    if (aVersion[i] !== bVersion[i]) {
      return Number(bVersion[i]) - Number(aVersion[i])
    }
  }
  return bVersion.length - aVersion.length
}

const isUpgradeable = (c: Cluster) => {
  return clusterSupportsAction(c, ClusterAction.Upgrade)
}

// setLatestVersions will set a cluster with latest version
// if no version is set in the currentMappings or if the version in currentMappings is invalid
const setLatestVersions = (
  clusters: Array<Cluster> | undefined,
  currentMappings: Record<string, string>
): Record<string, string> => {
  const res = {} as Record<string, string>
  clusters?.forEach((cluster: Cluster) => {
    if (cluster.name) {
      const clusterName = cluster.name
      const availableUpdates = (cluster.distribution?.upgradeInfo?.availableUpdates ?? []).sort(compareVersion)
      const latestVersion = availableUpdates && availableUpdates.length > 0 ? availableUpdates[0] : ''
      const currentValue = availableUpdates?.find(
        (curr) => currentMappings[clusterName] && curr === currentMappings[clusterName]
      )
      res[clusterName] = currentValue ? currentValue : latestVersion
    }
  })
  return res
}

export function BatchUpgradeModal(props: {
  close: () => void
  open: boolean
  clusters: Cluster[] | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const [selectVersions, setSelectVersions] = useState<Record<string, string>>({})
  const [upgradeableClusters, setUpgradeableClusters] = useState<Array<Cluster>>([])

  useEffect(() => {
    // set up latest if not selected
    const newUpgradeableClusters = props.clusters && props.clusters.filter(isUpgradeable)
    setSelectVersions((s) => setLatestVersions(newUpgradeableClusters, s))
    setUpgradeableClusters(newUpgradeableClusters || [])
  }, [props.clusters, props.open])

  return (
    <BulkActionModal<Cluster>
      open={props.open}
      title={t('bulk.title.upgrade')}
      action={t('upgrade.submit')}
      processing={t('upgrade.submit.processing')}
      items={upgradeableClusters}
      emptyState={
        <AcmEmptyState
          title={t('No clusters available')}
          message={t('None of the selected clusters can be upgraded.')}
        />
      }
      close={() => {
        setSelectVersions({})
        props.close()
      }}
      description={t('bulk.message.upgrade')}
      columns={[
        {
          header: t('upgrade.table.name'),
          sort: 'displayName',
          cell: (cluster) => (
            <>
              <span style={{ whiteSpace: 'nowrap' }}>{cluster.displayName}</span>
              {cluster.hive.clusterClaimName && (
                <TextContent>
                  <Text component={TextVariants.small}>{cluster.hive.clusterClaimName}</Text>
                </TextContent>
              )}
            </>
          ),
        },
        {
          header: t('upgrade.table.currentversion'),
          cell: (item: Cluster) => {
            const currentVersion = item?.distribution?.upgradeInfo?.currentVersion || ''
            return <span>{currentVersion}</span>
          },
        },
        {
          header: t('upgrade.table.newversion'),
          cell: (cluster: Cluster) => {
            const availableUpdates = (cluster.distribution?.upgradeInfo?.availableUpdates ?? []).sort(compareVersion)
            const hasAvailableUpgrades = availableUpdates && availableUpdates.length > 0
            return (
              <div>
                {hasAvailableUpgrades && (
                  <>
                    <AcmSelect
                      value={selectVersions[cluster.name || ''] || ''}
                      id={`${cluster.name}-upgrade-selector`}
                      maxHeight={'6em'}
                      label=""
                      isRequired
                      onChange={(version) => {
                        if (cluster.name && version) {
                          selectVersions[cluster.name] = version
                          setSelectVersions({ ...selectVersions })
                        }
                      }}
                    >
                      {availableUpdates?.map((version) => (
                        <SelectOption key={`${cluster.name}-${version}`} value={version}>
                          {version}
                        </SelectOption>
                      ))}
                    </AcmSelect>
                    <ReleaseNotesLink version={selectVersions[cluster.name!]} />
                  </>
                )}
              </div>
            )
          },
        },
      ]}
      keyFn={(cluster) => cluster.name as string}
      actionFn={(cluster) => {
        if (!cluster.name || !selectVersions[cluster.name]) {
          const emptyRes: IRequestResult<string> = {
            promise: new Promise((resolve) => resolve('')),
            abort: () => {},
          }
          return emptyRes
        }
        const patchSpec = {
          spec: {
            desiredCuration: 'upgrade',
            upgrade: {
              // set channel to empty to make sure we only use version
              channel: '',
              desiredUpdate: selectVersions[cluster.name],
            },
          },
        }
        const clusterCurator = {
          apiVersion: ClusterCuratorDefinition.apiVersion,
          kind: ClusterCuratorDefinition.kind,
          metadata: {
            name: cluster.name,
            namespace: cluster.namespace,
          },
        } as ClusterCurator

        const patchCuratorResult = patchResource(clusterCurator, patchSpec)
        let createCuratorResult: IRequestResult<ClusterCurator> | undefined = undefined
        return {
          promise: new Promise((resolve, reject) => {
            patchCuratorResult.promise
              .then((data) => {
                return resolve(data)
              })
              .catch((err: ResourceError) => {
                if (err.code === ResourceErrorCode.NotFound) {
                  // TODO: remove this creation logic when we can make sure clustercurator always exists
                  createCuratorResult = createResource({ ...clusterCurator, ...patchSpec })
                  createCuratorResult.promise.then((data) => resolve(data)).catch((err) => reject(err))
                } else {
                  reject(err)
                }
              })
          }),
          abort: () => {
            patchCuratorResult.abort()
            if (createCuratorResult) {
              createCuratorResult.abort()
            }
          },
        }
      }}
    />
  )
}
