/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import type { IResource } from '../../../../../resources'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import type { TopologyNode } from '../types'
import type { IFilteredConditionError, IResourcesWithStatus, TopologyAlert } from './analyzeTopology'
import type { AnalyzeTopologyHealthResult } from './analyzeTopologyHealth'
import { setPartialUnhealthyDeploymentNodePulses } from './analyzeTopologyHealth'
import { createSuggestsApplication } from './createSuggestsApplication'
import { createTopologyAlert, extractConditionsErrors } from './utils'

const MAX_PULL_APP_FETCHES = 3
const MAX_CONDITION_ERROR_ALERTS = 3

const dedupeAppSetAppsErrorsByReason = (errors: IFilteredConditionError[]): IFilteredConditionError[] => {
  const seenReasons = new Set<string>()

  return errors.filter((appSetAppsError) => {
    const reasons = appSetAppsError.errors.flatMap((filtered) => [
      filtered.firstError.reason,
      ...filtered.otherErrors.map((error) => error.reason),
    ])

    if (reasons.some((reason) => seenReasons.has(reason))) {
      return false
    }

    reasons.forEach((reason) => seenReasons.add(reason))
    return true
  })
}

/**
 * Analyzes ApplicationSet application condition errors and pull-model fetch failures.
 * Expects health analysis results from {@link analyzeTopologyHealth}.
 */
export const analyzeTopologyApplications = async (
  appSet: TopologyNode,
  deploymentNodes: TopologyNode[],
  alerts: TopologyAlert[],
  t: TFunction,
  health: AnalyzeTopologyHealthResult
): Promise<IFilteredConditionError[]> => {
  if (!health.shouldContinue) {
    return []
  }

  const { appMap, badResourceMap, hasApplicationIssues, appsetClusters, isAppSetPullModel } = health
  const namespace = appSet.namespace

  /////////////////////////////////////////////
  // get condition errors of applications in appMap
  /////////////////////////////////////////////
  if (isAppSetPullModel) {
    const entries = Object.entries(appMap).slice(0, MAX_PULL_APP_FETCHES)
    await Promise.all(
      entries.map(async ([mapKey, app]) => {
        const [clusterName, appName] = mapKey.split('/')
        const name = app.metadata?.name ?? ''
        if (!clusterName || !name) {
          return
        }

        try {
          const response = await fleetResourceRequest('GET', clusterName, {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'Application',
            name,
            namespace,
          })
          if ('errorMessage' in response) {
            const alert = createTopologyAlert(t('Application Missing'), 'red', {
              message: t("Cannot find '{{namespace}}/{{appName}}' on {{clusterName}}", {
                namespace,
                appName,
                clusterName,
              }),
              bullets: [
                {
                  title: t(
                    'For pulled applications, make sure the OpenShift GitOps Operator is installed on {{clusterName}}',
                    { clusterName }
                  ),
                  content: [],
                },
              ],
            })
            if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
              alerts.push(alert)
            }
            appSet.specs.pulse = 'red'
            return
          }
          appMap[mapKey] = response
        } catch {
          // Keep hub application data when remote fetch fails.
        }
      })
    )
  }

  /////////////////////////////////////////////
  // create alerts for apps with condition errors
  /////////////////////////////////////////////
  let appSetAppsErrors: IFilteredConditionError[] = []
  if (hasApplicationIssues) {
    const badAppResources = Object.values(badResourceMap.Application ?? {})
      .flat()
      .map((mapKey) => appMap[mapKey])
      .filter((app): app is IResource => app !== undefined) as IResourcesWithStatus[]

    appSetAppsErrors = dedupeAppSetAppsErrorsByReason(extractConditionsErrors(badAppResources, t)).slice(
      0,
      MAX_CONDITION_ERROR_ALERTS
    )

    if (appSetAppsErrors.length > 0) {
      appSetAppsErrors.forEach((appSetAppsError) => {
        createSuggestsApplication(appSet, appSetAppsError, alerts, t)
      })
      appSet.specs.pulse = 'red'
      setPartialUnhealthyDeploymentNodePulses(deploymentNodes, appsetClusters)
    }
  }

  return appSetAppsErrors
}
