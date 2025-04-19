/* Copyright Contributors to the Open Cluster Management project */

import { Skeleton, Stack, StackItem, Text, TextContent, TextVariants, SelectOption } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useEffect, useMemo, useState } from 'react'
import { BulkActionModal } from '../../../../../components/BulkActionModal'
import { PrePostTemplatesList } from '../../../../../components/TemplateSummaryModal'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { getUpgradeRiskPredictions } from '../../../../../lib/get-upgrade-risk-predictions'
import { ClusterCurator, ClusterCuratorDefinition, curatorActionHasJobs } from '../../../../../resources'
import {
  Cluster,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmAlert, AcmButton, AcmEmptyState, AcmSelect } from '../../../../../ui-components'
import { ClusterAction, clusterSupportsAction } from '../utils/cluster-actions'
import { ReleaseNotesLink } from './ReleaseNotesLink'
import './style.css'

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
  const { close, open, clusters } = props
  const { t } = useTranslation()
  const [selectVersions, setSelectVersions] = useState<Record<string, string>>({})
  const [upgradeableClusters, setUpgradeableClusters] = useState<Array<Cluster>>([])
  const [upgradeRiskPredictionsLoading, setUpgradeRiskPredictionsLoading] = useState<boolean>(true)
  const [upgradeRiskPredictions, setUpgradeRiskPredictions] = useState<any[]>([])

  const { clusterCuratorsState } = useSharedAtoms()
  const clusterCurators = useRecoilValue(clusterCuratorsState)

  const description = useMemo(() => {
    const hasUpgradeActions = upgradeableClusters.some((cluster) => {
      const curator = clusterCurators.find((cc) => cc.metadata?.namespace === cluster.namespace)
      return curatorActionHasJobs(curator?.spec?.upgrade)
    })
    return (
      <Stack hasGutter>
        {hasUpgradeActions && (
          <StackItem>
            <AcmAlert
              isInline
              noClose
              variant="info"
              title={t('Automation templates are configured')}
              message={t(
                'One or more of the selected clusters have automations that will run before or after the upgrade. Expand the table rows to view the Ansible templates for each cluster.'
              )}
            />
          </StackItem>
        )}
        <StackItem>{t('bulk.message.upgrade')}</StackItem>
      </Stack>
    )
  }, [clusterCurators, upgradeableClusters, t])

  useEffect(() => {
    // set up latest if not selected
    const newUpgradeableClusters = clusters && clusters.filter(isUpgradeable)
    setSelectVersions((s) => setLatestVersions(newUpgradeableClusters, s))
    setUpgradeableClusters(newUpgradeableClusters || [])
  }, [clusters, open])

  const managedClusterIds = useMemo(() => {
    const ids: string[] = []
    clusters?.forEach((cluster) => {
      if (cluster.labels?.clusterID) {
        ids.push(cluster.labels?.clusterID)
      }
    })
    return ids
  }, [clusters])

  useEffect(() => {
    if (open && managedClusterIds.length > 0) {
      getUpgradeRiskPredictions(managedClusterIds).then((res) => {
        const reducedUpgradeRiskPredictions = res.reduce((acc: any[], curr: any) => {
          if (curr.body && curr.body.predictions) {
            return [...acc, ...curr.body.predictions]
          }
          return acc
        }, [])
        setUpgradeRiskPredictions(reducedUpgradeRiskPredictions)
        setUpgradeRiskPredictionsLoading(false)
      })
    }
  }, [managedClusterIds, open])

  return (
    <BulkActionModal<Cluster>
      open={open}
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
        close()
      }}
      description={description}
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
          header: t('Update risks'),
          tooltip: t('Cluster update risks are only collected for OpenShift Container Platform clusters.'),
          cell: (item: Cluster) => {
            if (upgradeRiskPredictionsLoading) {
              return <Skeleton width={'50%'} />
            }
            const clusterID = item.labels?.clusterID
            const predictions = upgradeRiskPredictions.find(
              (clusterPredictions) => clusterPredictions.cluster_id === clusterID
            )
            if (predictions?.upgrade_risks_predictors?.alerts.length > 0) {
              return (
                <AcmButton
                  variant={'link'}
                  component={TextVariants.a}
                  href={`https://console.redhat.com/openshift/insights/advisor/clusters/${clusterID}?active_tab=update_risks`}
                  target="_blank"
                  style={{ padding: 0, fontSize: '14px' }}
                >
                  {t('upgrade.table.update.risk.link', [predictions?.upgrade_risks_predictors?.alerts.length])}
                  <ExternalLinkAltIcon style={{ marginLeft: '8px' }} />
                </AcmButton>
              )
            }
            // Update is currently only available for OCP clusters. Don't need to handle case where predictions aren't available for a non-OCP cluster.
            return t('No risks found')
          },
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
      addSubRows={(item: Cluster) => {
        const clusterCurator = item.isCurator
          ? clusterCurators.find((cc) => cc.metadata?.namespace === item.namespace)
          : undefined
        const upgradeAction = clusterCurator?.spec?.upgrade
        return upgradeAction && curatorActionHasJobs(upgradeAction)
          ? [
              {
                noPadding: false,
                cells: [
                  {
                    title: <PrePostTemplatesList curation="upgrade" curatorAction={upgradeAction} />,
                  },
                ],
              },
            ]
          : []
      }}
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
