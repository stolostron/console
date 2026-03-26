/* Copyright Contributors to the Open Cluster Management project */

import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { AcmAlertInfo, AcmAlertInfoWithId } from '../../../ui-components'
import { CommonProjectCreateProgressBar } from '../../../wizards/RoleAssignment/CommonProjectCreateProgressBar'
import { fireManagedClusterActionCreate, ProjectRequestApiVersion, ProjectRequestKind } from '../../../resources'

export interface MultipleCallbackProgress {
  successCount: number
  errorCount: number
  totalCount: number
  errorClusterNamespacesMap: Record<string, string[]>
}

export const getMissingNamespacesPerCluster = (
  clusterNamespaceMap: Record<string, string[]>,
  targetNamespaces: string[],
  clusterNamesSet: Set<string>
): Record<string, string[]> => {
  const uniqueTargetNamespaces = Array.from(new Set(targetNamespaces))
  return Array.from(clusterNamesSet).reduce<Record<string, string[]>>((acc, cluster) => {
    const existingNamespaces = new Set(clusterNamespaceMap[cluster] ?? [])
    const missing = uniqueTargetNamespaces.filter((ns) => !existingNamespaces.has(ns))
    if (missing.length > 0) {
      acc[cluster] = missing
    }
    return acc
  }, {})
}

interface HandleMissingNamespacesDeps {
  clusterNamespaceMap: Record<string, string[]>
  addAlertCallback: (alertInfo: AcmAlertInfo) => AcmAlertInfoWithId
  onStartCallback: (roleAssignment: FlattenedRoleAssignment, creatingAlert: AcmAlertInfoWithId) => void
  onProgressCallback: (progress: MultipleCallbackProgress) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

/**
 * Handles "missing namespaces" / "missing projects" for a role assignment:
 * creates ProjectRequest resources on each cluster for missing namespaces,
 * reports progress via onProgressCallback, and shows toasts for errors and completion.
 */
export async function handleMissingNamespaces(
  roleAssignment: FlattenedRoleAssignment,
  { clusterNamespaceMap, addAlertCallback, t, onStartCallback, onProgressCallback }: HandleMissingNamespacesDeps
): Promise<void> {
  const missingNamespacesPerCluster = getMissingNamespacesPerCluster(
    clusterNamespaceMap,
    roleAssignment.targetNamespaces ?? [],
    new Set(roleAssignment.clusterNames ?? [])
  )
  const totalCount = Object.values(missingNamespacesPerCluster).reduce((sum, namespaces) => sum + namespaces.length, 0)

  if (totalCount > 0) {
    const creatingAlert = addAlertCallback({
      title: t('Creating missing projects'),
      message: <CommonProjectCreateProgressBar successCount={0} errorCount={0} totalCount={totalCount} />,
      type: 'info',
      autoClose: false,
    })
    onStartCallback(roleAssignment, creatingAlert)
    onProgressCallback({ successCount: 0, errorCount: 0, totalCount, errorClusterNamespacesMap: {} })

    const counter = {
      success: 0,
      error: 0,
      errorClusterNamespacesMap: {} as Record<string, string[]>,
      totalCount,
    }

    const createMissingProject = async (clusterName: string, namespace: string) => {
      try {
        const actionResponse = await fireManagedClusterActionCreate(clusterName, {
          apiVersion: ProjectRequestApiVersion,
          kind: ProjectRequestKind,
          metadata: { name: namespace },
        })

        if (actionResponse?.actionDone === 'ActionDone') {
          counter.success++
        } else {
          counter.error++
          counter.errorClusterNamespacesMap = {
            ...counter.errorClusterNamespacesMap,
            [clusterName]: [...(counter.errorClusterNamespacesMap[clusterName] ?? []), namespace],
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        counter.error++
        counter.errorClusterNamespacesMap = {
          ...counter.errorClusterNamespacesMap,
          [clusterName]: [...(counter.errorClusterNamespacesMap[clusterName] ?? []), namespace],
        }
      } finally {
        onProgressCallback({
          successCount: counter.success,
          errorCount: counter.error,
          totalCount: counter.totalCount,
          errorClusterNamespacesMap: counter.errorClusterNamespacesMap,
        })
      }
    }

    const queue = Object.entries(missingNamespacesPerCluster).flatMap(([clusterName, namespaces]) =>
      namespaces.map((namespace) => ({ clusterName, namespace }))
    )

    const concurrency = 10
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency)
      await Promise.all(batch.map(({ clusterName, namespace }) => createMissingProject(clusterName, namespace)))
    }
  } else {
    addAlertCallback({
      title: t('No missing projects'),
      message: t(
        'No missing projects found for {{name}} RoleAssignment. MultiClusterRoleAssignment reconciliation is in progress.',
        { name: roleAssignment.name }
      ),
      type: 'info',
      autoClose: true,
    })
  }
}
