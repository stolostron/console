/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import jsYaml from 'js-yaml'
import stringSimilarity from 'string-similarity'
import { DOC_LINKS } from '~/lib/doc-util'
import type { ApplicationSet } from '~/resources'
import type { TopologyNode } from '../types'
import type { IFilteredConditionError, TopologyAlert } from './analyzeTopology'
import { createTopologyErrorAlert, TopologyAlertActionType } from './utils'

const APP_PATH_DOES_NOT_EXIST_MESSAGE =
  'Failed to load target state: failed to generate manifest for source: app path does not exist'
const MANIFEST_GENERATION_RPC_UNAVAILABLE_MESSAGE =
  'Failed to load target state: failed to generate manifest for source SOURCE: rpc error: code = Unavailable desc = connection error: desc = "transport: Error while dialing: dial tcp ADDRESS:PORT: connect: connection refused"'
const FAILED_SYNC_MESSAGE =
  'Failed last sync attempt to []: one or more synchronization tasks completed unsuccessfully,  (retried 5 times).'
const NAMESPACE_NOT_FOUND_SYNC_MESSAGE =
  'Failed last sync attempt to []: one or more synchronization tasks completed unsuccessfully, reason: namespaces "NAMESPACE" not found (retried 5 times).'
const FORBIDDEN_SYNC_MESSAGE =
  'Failed last sync attempt to []: one or more objects failed to apply, reason: RESOURCE is forbidden: User "SERVICEACCOUNT" cannot create resource "RESOURCE" in API group "APIGROUP" in the namespace "NAMESPACE" (retried 5 times).'
const SOURCE_REQUIRED_MESSAGE = 'either source.path, source.chart, or source.ref are required for source '
const SIMILARITY_THRESHOLD = 0.7

/** Collapses variable rpc / path details so app-path errors compare consistently. */
const normalizeAppPathDoesNotExistMessage = (message: string): string =>
  message
    .replace(
      /Failed to load target state: failed to generate manifest for source.*?app path does not exist/i,
      APP_PATH_DOES_NOT_EXIST_MESSAGE
    )
    .replace(/\s+/g, ' ')
    .trim()

const isAppPathDoesNotExistMessage = (message: string): boolean =>
  stringSimilarity.compareTwoStrings(
    normalizeAppPathDoesNotExistMessage(message),
    normalizeAppPathDoesNotExistMessage(APP_PATH_DOES_NOT_EXIST_MESSAGE)
  ) > SIMILARITY_THRESHOLD

/** Strips variable source index and dial address so manifest RPC errors compare consistently. */
const normalizeManifestGenerationRpcUnavailableMessage = (message: string): string =>
  message
    .replace(
      /Failed to load target state: failed to generate manifest for source \d+ of \d+:/i,
      'Failed to load target state: failed to generate manifest for source SOURCE:'
    )
    .replace(/dial tcp [^:]+:\d+:/i, 'dial tcp ADDRESS:PORT:')
    .replace(/\s+/g, ' ')
    .trim()

const isManifestGenerationRpcUnavailableMessage = (message: string): boolean =>
  /Failed to load target state: failed to generate manifest for source/i.test(message) &&
  /rpc error: code = Unavailable/i.test(message) &&
  /connection refused/i.test(message) &&
  stringSimilarity.compareTwoStrings(
    normalizeManifestGenerationRpcUnavailableMessage(message),
    normalizeManifestGenerationRpcUnavailableMessage(MANIFEST_GENERATION_RPC_UNAVAILABLE_MESSAGE)
  ) > SIMILARITY_THRESHOLD

/** Strips variable sync revision / reason so failed-sync messages compare consistently. */
const normalizeFailedSyncMessage = (message: string): string =>
  message
    .replace(/Failed last sync attempt to \[[^\]]*\]/i, 'Failed last sync attempt to []')
    .replace(/,\s*reason:.*?(?=\(retried)/i, ',  ')
    .replace(/\s+/g, ' ')
    .trim()

const isFailedSyncMessage = (message: string): boolean =>
  stringSimilarity.compareTwoStrings(
    normalizeFailedSyncMessage(message),
    normalizeFailedSyncMessage(FAILED_SYNC_MESSAGE)
  ) > SIMILARITY_THRESHOLD

/** Strips variable sync revision and namespace so namespace-not-found sync errors compare consistently. */
const normalizeNamespaceNotFoundSyncMessage = (message: string): string =>
  message
    .replace(/Failed last sync attempt to \[[^\]]*\]/i, 'Failed last sync attempt to []')
    .replace(/one or more objects failed to apply/i, 'one or more synchronization tasks completed unsuccessfully')
    .replace(/reason: namespaces "[^"]+" not found/i, 'reason: namespaces "NAMESPACE" not found')
    .replace(/\s+/g, ' ')
    .trim()

const isNamespaceNotFoundSyncMessage = (message: string): boolean =>
  (/one or more synchronization tasks completed unsuccessfully/i.test(message) ||
    /one or more objects failed to apply/i.test(message)) &&
  /namespaces "[^"]+" not found/i.test(message) &&
  stringSimilarity.compareTwoStrings(
    normalizeNamespaceNotFoundSyncMessage(message),
    normalizeNamespaceNotFoundSyncMessage(NAMESPACE_NOT_FOUND_SYNC_MESSAGE)
  ) > SIMILARITY_THRESHOLD

const getNamespaceNotFoundSyncNamespace = (message: string): string | undefined => {
  const match = /namespaces "([^"]+)" not found/i.exec(message)
  return match?.[1]
}

/** Strips variable sync revision, resources, and namespace so forbidden-sync errors compare consistently. */
const normalizeForbiddenSyncMessage = (message: string): string =>
  message
    .replace(/Failed last sync attempt to \[[^\]]*\]/i, 'Failed last sync attempt to []')
    .replace(
      /reason:.*?(?=\(retried)/i,
      'reason: RESOURCE is forbidden: User "SERVICEACCOUNT" cannot create resource "RESOURCE" in API group "APIGROUP" in the namespace "NAMESPACE" '
    )
    .replace(/\s+/g, ' ')
    .trim()

const isForbiddenSyncMessage = (message: string): boolean =>
  /one or more objects failed to apply/i.test(message) &&
  /is forbidden:/i.test(message) &&
  stringSimilarity.compareTwoStrings(
    normalizeForbiddenSyncMessage(message),
    normalizeForbiddenSyncMessage(FORBIDDEN_SYNC_MESSAGE)
  ) > SIMILARITY_THRESHOLD

const getForbiddenSyncNamespace = (message: string): string | undefined => {
  const match = /in the namespace "([^"]+)"/.exec(message)
  return match?.[1]
}

/** Collapses variable source index so missing path/chart/ref errors compare consistently. */
const normalizeSourceRequiredMessage = (message: string): string =>
  message
    .replace(/either source\.path, source\.chart, or source\.ref are required for source.*/i, SOURCE_REQUIRED_MESSAGE)
    .replace(/\s+/g, ' ')
    .trim()

const isSourceRequiredMessage = (message: string): boolean =>
  stringSimilarity.compareTwoStrings(
    normalizeSourceRequiredMessage(message),
    normalizeSourceRequiredMessage(SOURCE_REQUIRED_MESSAGE)
  ) > SIMILARITY_THRESHOLD

export const createSuggestsApplication = (
  node: TopologyNode,
  filteredError: IFilteredConditionError,
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  const applicationSet = node.specs.raw as ApplicationSet

  filteredError.errors.forEach((error) => {
    const message = error.firstError.message
    const singleError = { ...filteredError, errors: [error] }

    switch (true) {
      case isAppPathDoesNotExistMessage(message): {
        const currentYaml = jsYaml
          .dump(applicationSet.spec.template?.spec?.sources ?? applicationSet.spec.template?.spec?.source ?? {}, {
            indent: 2,
          })
          .split('\n')
        const suggestions = [
          { title: t('Check that the repository path exists for each source') },
          { title: t('Current sources'), content: currentYaml },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
          ],
          alerts,
          singleError,
          t
        )
        break
      }
      case isNamespaceNotFoundSyncMessage(message): {
        const namespace = getNamespaceNotFoundSyncNamespace(message)
        const conciseMessage = namespace
          ? t('Sync failed: namespace {{namespace}} not found', { namespace })
          : t('Sync failed: target namespace not found')
        const namespaceNotFoundError = {
          ...singleError,
          errors: [
            {
              ...error,
              firstError: { ...error.firstError, message: conciseMessage },
            },
          ],
        }
        const suggestions = [
          {
            title: namespace
              ? t(
                  'Resources in this application require namespace {{namespace}}, but it does not exist on the target cluster',
                  { namespace }
                )
              : t('Resources in this application require a namespace that does not exist on the target cluster'),
          },
          {
            title: namespace
              ? t(
                  'Add a Namespace manifest for {{namespace}} to the application, or create the namespace on the cluster before syncing',
                  { namespace }
                )
              : t('Add a Namespace manifest to the application, or create the namespace on the cluster before syncing'),
          },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
            {
              label: t('Launch Argo editor'),
              type: TopologyAlertActionType.launchArgo,
              node,
            },
          ],
          alerts,
          namespaceNotFoundError,
          t
        )
        break
      }
      case isFailedSyncMessage(message): {
        const currentYaml = jsYaml
          .dump(applicationSet.spec.template?.spec?.sources ?? applicationSet.spec.template?.spec?.source ?? {}, {
            indent: 2,
          })
          .split('\n')
        const suggestions = [
          { title: t('Try syncing resources again') },
          { title: t('If the problem persists, check the application details in Argo CD') },
          { title: t('Current sources'), content: currentYaml },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
            {
              label: t('Sync resources'),
              type: TopologyAlertActionType.syncResources,
              node,
            },
            {
              label: t('Launch Argo editor'),
              type: TopologyAlertActionType.launchArgo,
              node,
            },
          ],
          alerts,
          singleError,
          t
        )
        break
      }
      case isManifestGenerationRpcUnavailableMessage(message): {
        const manifestRpcError = {
          ...singleError,
          errors: [
            {
              ...error,
              firstError: {
                ...error.firstError,
                message: t('Failed to generate manifests: GitOps manifest service unavailable'),
              },
            },
          ],
        }
        const suggestions = [
          {
            title: t(
              'Argo CD could not reach the manifest generation service while loading the application target state'
            ),
          },
          {
            title: t(
              'For pull applications, verify the OpenShift GitOps Operator is installed and healthy on the target cluster'
            ),
          },
          {
            title: t(
              'Verify managed cluster connectivity and that the GitOps repo-server or config management plugin is running'
            ),
          },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
            {
              label: t('Sync resources'),
              type: TopologyAlertActionType.syncResources,
              node,
            },
            {
              label: t('Launch Argo editor'),
              type: TopologyAlertActionType.launchArgo,
              node,
            },
          ],
          alerts,
          manifestRpcError,
          t
        )
        break
      }
      case isForbiddenSyncMessage(message): {
        const namespace = getForbiddenSyncNamespace(message)
        const conciseMessage = namespace
          ? t('Sync failed: insufficient permissions to create resources in {{namespace}}', { namespace })
          : t('Sync failed: insufficient permissions to create resources')
        const forbiddenError = {
          ...singleError,
          errors: [
            {
              ...error,
              firstError: { ...error.firstError, message: conciseMessage },
            },
          ],
        }
        const suggestions = [
          {
            title: namespace
              ? t('Argo CD lacks permission to create resources in namespace {{namespace}}', { namespace })
              : t('Argo CD lacks permission to create resources in the target namespace'),
          },
          {
            title: t('Grant the GitOps controller service account RBAC access to the target namespace'),
          },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            ...(node.specs.isAppSetPullModel
              ? [
                  {
                    label: t('View documentation'),
                    type: TopologyAlertActionType.openUrl,
                    action: { url: DOC_LINKS.GITOPS_REGISTER },
                  },
                ]
              : []),
          ],
          alerts,
          forbiddenError,
          t
        )
        break
      }
      case isSourceRequiredMessage(message): {
        const currentYaml = jsYaml
          .dump(applicationSet.spec.template?.spec?.sources ?? applicationSet.spec.template?.spec?.source ?? {}, {
            indent: 2,
          })
          .split('\n')
        const suggestions = [
          { title: t('Each source must specify path, chart, or ref') },
          { title: t('Current sources'), content: currentYaml },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
          ],
          alerts,
          singleError,
          t
        )
        break
      }
      default: {
        const currentYaml = jsYaml.dump(applicationSet.spec.template?.spec?.sources ?? {}, { indent: 2 }).split('\n')
        const suggestions = [{ title: t('Current sources'), content: currentYaml }]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
            },
            ...(node.type === 'pod'
              ? [
                  {
                    label: t('Show logs'),
                    type: TopologyAlertActionType.showLog,
                    node,
                  },
                ]
              : []),
          ],
          alerts,
          singleError,
          t
        )
      }
    }
  })
}
