/* Copyright Contributors to the Open Cluster Management project */

import { EditorValidationStatus } from '@patternfly-labs/react-form-wizard'
import { ActionList, ActionListGroup, ActionListItem, Alert, AlertGroup, Button } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import cloneDeep from 'lodash/cloneDeep'
import jsYaml from 'js-yaml'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SyncEditor, ValidationStatus } from '~/components/SyncEditor/SyncEditor'
import { useTranslation } from '~/lib/acm-i18next'
import { PluginContext } from '~/lib/PluginContext'
import { canUser } from '~/lib/rbac-util'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { getGroupFromApiVersion, getResource } from '~/resources/utils'
import { fleetCanUser } from '~/resources/utils/fleet-can-user'
import { fleetResourceRequest } from '~/resources/utils/fleet-resource-request'
import { onReload, onSave } from '~/routes/Search/components/YamlEditor/utils'
import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'
import { AcmAlert, AcmLoadingPage, AcmModal } from '~/ui-components'

const typesWithoutDefaultName = new Set(['replicaset', 'pod', 'replicationcontroller', 'controllerrevision'])

export interface IEditYamlModalProps {
  close: () => void
  open: boolean
  node: TopologyNode
  hubClusterName: string
  highlightEditorPath?: string
  onUpdateSuccess?: (nodeId: string) => void
}

export function EditYamlModal(props: IEditYamlModalProps | { open: false }) {
  if (props.open === false) {
    return null
  }

  return <EditYamlModalContent {...props} />
}

function EditYamlModalContent({
  close,
  node: topologyNode,
  hubClusterName,
  highlightEditorPath,
  onUpdateSuccess,
}: Readonly<Omit<IEditYamlModalProps, 'open'>>) {
  const { t } = useTranslation()
  const node = topologyNode as any
  const {
    multiclusterApi: { useFleetK8sWatchResource },
  } = useContext(PluginContext)
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  let name = node?.name ?? ''
  let cluster = node?.cluster ?? node?.specs?.clustersNames?.[0] ?? ''
  const remoteArgoCluster = node?.specs?.raw?.status?.cluster
  if (remoteArgoCluster) {
    cluster = remoteArgoCluster
  }
  const namespace = node?.namespace ?? ''
  const type = node?.type ?? ''
  const kind = type === 'git' || type === 'chart' ? 'applicationset' : type
  let apiVersion = node?.specs?.raw?.apiVersion ?? ''
  const isDesign = node?.specs?.isDesign ?? false

  if (type === 'project') {
    apiVersion = 'project.openshift.io/v1'
  }
  if (typesWithoutDefaultName.has(type)) {
    const typeModel = node?.specs?.[`${kind}Model`]
    if (typeModel && Object.keys(typeModel).length > 0) {
      const modelArray = typeModel[Object.keys(typeModel)[0]]
      name = modelArray[0]?.name
      cluster = modelArray[0]?.cluster
    }
  }

  if (!cluster) {
    cluster = hubClusterName
  }

  if (!apiVersion) {
    const resourceModel = node?.specs?.[`${kind}Model`]
    if (resourceModel && Object.keys(resourceModel).length > 0) {
      const modelArray = resourceModel[Object.keys(resourceModel)[0]]
      const apigroup = modelArray[0]?.apigroup
      const apiver = modelArray[0]?.apiversion
      apiVersion = apigroup ? apigroup + '/' + apiver : apiver
    }
  }

  const isHubClusterResource = (cluster === hubClusterName || isDesign) && !remoteArgoCluster
  const capitalizedKind = kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : ''
  const editorTitle = [
    capitalizedKind,
    kind === 'applicationset' || kind === 'placement' || kind === 'placementdecision' ? undefined : cluster,
    namespace,
    name,
  ]
    .filter(Boolean)
    .join(' > ')

  const [resource, setResource] = useState<any>(undefined)
  const [defaultItem, setDefaultItem] = useState<any>(undefined)
  const [resources, setResources] = useState<any[]>([])
  const [resourceError, setResourceError] = useState({ message: '', stack: '' })
  const [readOnly, setReadOnly] = useState(true)
  const [stale, setStale] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [editorValidationStatus, setEditorValidationStatus] = useState(EditorValidationStatus.success)
  const [isReloading, setIsReloading] = useState(false)
  const shouldFoldAfterReloadRef = useRef(false)
  const { apiGroup, version } = getGroupFromApiVersion(apiVersion)
  const [resourceUpdate, watchLoaded, watchError] = useFleetK8sWatchResource({
    groupVersionKind: { group: apiGroup, version, kind },
    name,
    namespace,
    cluster,
  })

  const fetchResource = useCallback(() => {
    if ((cluster === hubClusterName || isDesign) && !remoteArgoCluster) {
      return getResource({
        apiVersion,
        kind,
        metadata: { namespace, name },
      }).promise
    }
    return fleetResourceRequest('GET', cluster, {
      apiVersion,
      kind,
      name,
      namespace,
    }).then((res: any) => {
      if ('errorMessage' in res) {
        throw new Error(res.errorMessage)
      }
      return res
    })
  }, [apiVersion, cluster, hubClusterName, isDesign, kind, name, namespace, remoteArgoCluster])

  useEffect(() => {
    let isComponentMounted = true
    const loadResource =
      (type === 'applicationset' || type === 'placement') && node?.specs?.raw
        ? Promise.resolve(node.specs.raw)
        : fetchResource()

    loadResource
      .then((response) => {
        if (isComponentMounted) {
          setResource(response)
          setDefaultItem(cloneDeep(response))
          setResources([response])
          setResourceError({ message: '', stack: '' })
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        if (isComponentMounted) {
          setResourceError({ message: err.message ?? String(err), stack: '' })
        }
      })
    return () => {
      isComponentMounted = false
    }
  }, [fetchResource, node?.specs?.raw, type])

  const watchedResource = Array.isArray(resourceUpdate) ? resourceUpdate[0] : resourceUpdate
  useEffect(() => {
    if (
      watchLoaded &&
      !watchError &&
      watchedResource?.metadata?.resourceVersion &&
      resource?.metadata?.resourceVersion &&
      watchedResource.metadata.resourceVersion !== resource.metadata.resourceVersion
    ) {
      setStale(true)
    }
  }, [watchedResource?.metadata?.resourceVersion, resource?.metadata?.resourceVersion, watchLoaded, watchError])

  useEffect(() => {
    if (updateSuccess) {
      onUpdateSuccess?.(topologyNode.id ?? '')
      close()
    }
  }, [updateSuccess, close, onUpdateSuccess, topologyNode.id])

  useEffect(() => {
    const resourceForRbac = {
      apiVersion,
      kind,
      metadata: { name, namespace },
    }
    const canUpdate = isHubClusterResource
      ? canUser('update', resourceForRbac, namespace, name)
      : fleetCanUser('update', cluster, resourceForRbac, namespace, name)
    canUpdate.promise
      .then((result) => setReadOnly(!(result.status?.allowed ?? false)))
      .catch((err) => console.error(err))
    return () => canUpdate.abort()
  }, [apiVersion, cluster, isHubClusterResource, kind, name, namespace])

  const update = useCallback((changes: any, resetDefaultSnapshot?: boolean) => {
    if (changes?.resources) {
      const nextResources = Array.isArray(changes.resources) ? changes.resources : [changes.resources]
      setResources(nextResources)
      if (resetDefaultSnapshot) {
        const nextDefault = Array.isArray(changes.resources) ? changes.resources[0] : changes.resources
        setDefaultItem(cloneDeep(nextDefault))
      }
    }
  }, [])

  const setResourceYaml = useCallback(
    (value: string | ((prev: string) => string)) => {
      const currentYaml = resources[0] ? jsYaml.dump(resources[0], { indent: 2 }) : ''
      const yaml = typeof value === 'function' ? value(currentYaml) : value
      try {
        const parsed = jsYaml.load(yaml)
        setResource(parsed)
        setResources([parsed])
        setDefaultItem(cloneDeep(parsed))
      } catch (err) {
        console.error('Error parsing resource YAML: ', err)
      }
    },
    [resources]
  )

  const handleReload = useCallback(() => {
    setUpdateError('')
    setUpdateSuccess(false)
    setIsReloading(true)

    const finishReload = () => setIsReloading(false)

    onReload(
      cluster,
      kind,
      apiVersion,
      name,
      namespace,
      isHubClusterResource,
      (value) => {
        setResourceYaml(value)
        finishReload()
      },
      (error) => {
        setUpdateError(error)
        finishReload()
      },
      setStale,
      isFineGrainedRbacEnabled,
      shouldFoldAfterReloadRef
    )
  }, [apiVersion, cluster, isFineGrainedRbacEnabled, isHubClusterResource, kind, name, namespace, setResourceYaml])

  if (!resource && resourceError.message === '') {
    return (
      <AcmModal
        id="edit-yaml-modal"
        isOpen={true}
        title={t('Edit YAML')}
        aria-label={t('Edit YAML')}
        showClose={true}
        onClose={close}
        variant={ModalVariant.large}
        position="top"
        hasNoBodyWrapper
      >
        <div
          style={{
            height: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 'var(--pf-t--global--spacer--sm)',
          }}
        >
          <AcmLoadingPage />
        </div>
      </AcmModal>
    )
  }

  return (
    <AcmModal
      id="edit-yaml-modal"
      isOpen={true}
      title={t('Edit YAML')}
      aria-label={t('Edit YAML')}
      showClose={true}
      onClose={close}
      variant={ModalVariant.large}
      position="top"
      hasNoBodyWrapper
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '70vh',
          paddingTop: 'var(--pf-t--global--spacer--sm)',
          paddingLeft: 'var(--pf-t--global--spacer--lg)',
          paddingRight: 'var(--pf-t--global--spacer--lg)',
        }}
      >
        <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
          {resourceError.message !== '' && (
            <AcmAlert
              noClose={true}
              variant={'danger'}
              isInline={true}
              title={`${t('Error querying for resource:')} ${name}`}
              subtitle={resourceError.message}
            />
          )}
          {resources.length > 0 && (
            <div
              style={{
                height: '100%',
                opacity: isReloading ? 0.3 : 1,
                pointerEvents: isReloading ? 'none' : 'auto',
              }}
            >
              <SyncEditor
                editorTitle={editorTitle}
                variant="toolbar"
                resources={resources}
                defaultResources={defaultItem}
                filters={['*.metadata.managedFields']}
                highlightEditorPath={highlightEditorPath}
                initialShowChanges={true}
                renderSideBySide={false}
                onEditorChange={(changes, resetDefaultSnapshot): void => {
                  update(changes, resetDefaultSnapshot)
                }}
                onStatusChange={(editorStatus: ValidationStatus): void => {
                  setEditorValidationStatus(editorStatus as unknown as EditorValidationStatus)
                }}
              />
            </div>
          )}
        </div>
        <div
          className="yaml-editor__buttons"
          style={{
            paddingBottom: 'var(--pf-t--global--spacer--lg)',
          }}
        >
          {(updateSuccess || updateError || stale) && (
            <AlertGroup style={{ paddingBottom: '1rem' }}>
              {updateSuccess && (
                <Alert
                  id="editor-action-update-alert"
                  isInline
                  variant="success"
                  title={t('{{name}} has been updated.', { name })}
                />
              )}
              {updateError !== '' && (
                <Alert
                  id="editor-action-error-alert"
                  isInline
                  variant="danger"
                  title={t('Error occurred while updating resource: {{name}}', { name })}
                >
                  {updateError}
                </Alert>
              )}
              {stale && (
                <Alert
                  id="editor-action-stale-alert"
                  isInline
                  variant="info"
                  title={t('This object has been updated.')}
                >
                  {t('Click reload to see the new version.')}
                </Alert>
              )}
            </AlertGroup>
          )}
          <ActionList
            style={{
              justifyContent: 'space-between',
              paddingTop: '1rem',
            }}
          >
            <ActionListGroup>
              <ActionListItem>
                <Button
                  variant="primary"
                  id="update-resource-button"
                  isDisabled={
                    readOnly ||
                    resources.length === 0 ||
                    resourceError.message !== '' ||
                    isReloading ||
                    editorValidationStatus === EditorValidationStatus.failure ||
                    editorValidationStatus === EditorValidationStatus.pending
                  }
                  onClick={() => {
                    setUpdateError('')
                    setUpdateSuccess(false)
                    onSave(
                      cluster,
                      kind,
                      apiVersion,
                      name,
                      namespace,
                      jsYaml.dump(resources[0], { indent: 2 }),
                      isHubClusterResource,
                      setResourceYaml,
                      setUpdateError,
                      setUpdateSuccess,
                      setStale,
                      isFineGrainedRbacEnabled,
                      shouldFoldAfterReloadRef
                    )
                  }}
                >
                  {t('Save')}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant="secondary" id="reload-resource-button" isDisabled={isReloading} onClick={handleReload}>
                  {t('Reload')}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button
                  variant="secondary"
                  id="cancel-resource-button"
                  data-test="cancel-resource-button"
                  onClick={close}
                >
                  {t('Cancel')}
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </div>
      </div>
    </AcmModal>
  )
}
