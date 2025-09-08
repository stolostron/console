/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { ActionList, ActionListGroup, ActionListItem, Alert, Button, PageSection } from '@patternfly/react-core'
import { DownloadIcon } from '@patternfly/react-icons'
import { FleetK8sResourceCommon } from '@stolostron/multicluster-sdk/lib/types/fleet'
import { saveAs } from 'file-saver'
import jsYaml from 'js-yaml'
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom-v5-compat'
import YamlEditor from '../../../components/YamlEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { canUser } from '../../../lib/rbac-util'
import { fireManagedClusterAction, fireManagedClusterView, IResource } from '../../../resources'
import { getGroupFromApiVersion } from '../../../resources/utils'
import {
  getBackendUrl,
  getRequest,
  getResource,
  putRequest,
  replaceResource,
} from '../../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmLoadingPage } from '../../../ui-components'
import { useSearchDetailsContext } from './DetailsPage'

const headerContainer = css({
  display: 'flex',
  backgroundColor: 'var(--pf-v5-global--palette--black-850)',
  fontSize: '14px',
})
const spacer = css({
  borderRight: '1px solid var(--pf-v5-global--palette--black-700)',
  paddingLeft: '1rem',
})
const textTitle = css({
  color: 'var(--pf-v5-global--palette--black-300)',
  padding: '1rem',
})
const textContent = css({
  color: 'var(--pf-v5-global--palette--white)',
  padding: '1rem 0',
  fontWeight: 700,
})

/* istanbul ignore next */
function loadResource(
  cluster: string,
  kind: string,
  apiversion: string,
  name: string,
  namespace: string,
  isHubClusterResource: boolean,
  setResourceYaml: Dispatch<SetStateAction<string>>,
  setUpdateError: Dispatch<SetStateAction<string>>,
  setResourceVersion: Dispatch<SetStateAction<string>>,
  setStale: Dispatch<SetStateAction<boolean>>,
  isFineGrainedRbacEnabled: boolean
) {
  if (isFineGrainedRbacEnabled && (kind === 'VirtualMachine' || kind === 'VirtualMachineSnapshot')) {
    const url = getBackendUrl() + `/${kind.toLowerCase()}s/get/${cluster}/${name}/${namespace}` // need the plural kind either virtualmachines || virtualmachinesnapshots
    getRequest<IResource>(url)
      .promise.then((response) => {
        setResourceYaml(jsYaml.dump(response, { indent: 2 }))
        setResourceVersion(response?.metadata?.resourceVersion ?? '')
        setStale(false)
      })
      .catch((err) => {
        console.error('Error getting VM resource: ', err)
        setUpdateError(`Error getting new resource YAML: ${err.message}`)
      })
  } else if (isHubClusterResource) {
    getResource({
      apiVersion: apiversion,
      kind,
      metadata: { namespace, name },
    })
      .promise.then((response: any) => {
        setResourceYaml(jsYaml.dump(response, { indent: 2 }))
        setResourceVersion(response?.metadata?.resourceVersion ?? '')
        setStale(false)
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setUpdateError(`Error getting new resource YAML: ${err.message}`)
      })
  } else {
    fireManagedClusterView(cluster, kind, apiversion, name, namespace)
      .then((viewResponse: any) => {
        if (viewResponse?.message) {
          setUpdateError(`Error getting new resource YAML: ${viewResponse.message}`)
        } else {
          setResourceYaml(jsYaml.dump(viewResponse?.result, { indent: 2 }))
          setResourceVersion(viewResponse?.result?.metadata?.resourceVersion ?? '')
          setStale(false)
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setUpdateError(`Error getting new resource YAML: ${err}`)
      })
  }
}

/* istanbul ignore next */
function updateResource(
  cluster: string,
  kind: string,
  apiversion: string,
  name: string,
  namespace: string,
  resourceYaml: string,
  isHubClusterResource: boolean,
  setResourceYaml: Dispatch<SetStateAction<string>>,
  setUpdateError: Dispatch<SetStateAction<string>>,
  setUpdateSuccess: Dispatch<SetStateAction<boolean>>,
  setResourceVersion: Dispatch<SetStateAction<string>>,
  setStale: Dispatch<SetStateAction<boolean>>,
  isFineGrainedRbacEnabled: boolean
) {
  if (isFineGrainedRbacEnabled && (kind === 'VirtualMachine' || kind === 'VirtualMachineSnapshot')) {
    const url = getBackendUrl() + `/${kind.toLowerCase()}s/update` // need the plural kind either virtualmachines || virtualmachinesnapshots
    const parsedYaml = jsYaml.load(resourceYaml) as IResource
    putRequest(url, { reqBody: parsedYaml, managedCluster: cluster, vmName: name, vmNamespace: namespace })
      .promise.then(() => {
        setUpdateSuccess(true)
      })
      .catch((err) => {
        console.error('Error updating resource: ', err)
        setUpdateError(err.message)
      })
  } else if (isHubClusterResource) {
    try {
      const parsedYaml = jsYaml.load(resourceYaml) as IResource
      replaceResource(parsedYaml)
        .promise.then(() => {
          loadResource(
            cluster,
            kind,
            apiversion,
            name,
            namespace,
            isHubClusterResource,
            setResourceYaml,
            setUpdateError,
            setResourceVersion,
            setStale,
            isFineGrainedRbacEnabled
          )
          setUpdateSuccess(true)
        })
        .catch((err) => {
          console.error('Error updating resource: ', err)
          setUpdateError(err.message)
        })
    } catch (err: any) {
      console.error('Error updating resource: ', err)
      setUpdateError(err?.message)
    }
  } else {
    fireManagedClusterAction('Update', cluster, kind, apiversion, name, namespace, jsYaml.loadAll(resourceYaml)[0])
      .then((actionResponse) => {
        if (actionResponse.actionDone === 'ActionDone') {
          loadResource(
            cluster,
            kind,
            apiversion,
            name,
            namespace,
            isHubClusterResource,
            setResourceYaml,
            setUpdateError,
            setResourceVersion,
            setStale,
            isFineGrainedRbacEnabled
          )
          setUpdateSuccess(true)
        } else {
          setUpdateError(actionResponse.message)
        }
      })
      .catch((err) => {
        console.error('Error updating resource: ', err)
        setUpdateError(err)
      })
  }
}

/* istanbul ignore next */
function onCancel(navigate: any) {
  // OCP returns to previous page
  // We could instead revert any changes and remain on the page || if no changes then go back to previous page?
  navigate(-1)
}

/* istanbul ignore next */
function downloadYaml(name: string, resource: string) {
  const blob = new Blob([resource], { type: 'text/yaml;charset=utf-8' })
  saveAs(blob, `${name}.yaml`)
}

export function EditorHeaderBar(props: Readonly<{ cluster: string; namespace: string }>) {
  const { cluster, namespace } = props
  const { t } = useTranslation()

  return (
    <div id={'yaml-editor-header-wrapper'} className={headerContainer}>
      {/* No translation - this is a kube resource field */}
      <p className={textTitle}>{'Cluster:'}</p>
      <p className={textContent}>{cluster}</p>
      <div className={spacer} />
      {/* No translation - this is a kube resource field */}
      <p className={textTitle}>{'Namespace:'}</p>
      <p className={textContent}>{namespace !== '' ? namespace : t('Resource is not namespaced')}</p>
    </div>
  )
}

export function EditorActionBar(
  props: Readonly<{
    cluster: string
    kind: string
    apiversion: string
    name: string
    namespace: string
    isHubClusterResource: boolean
    resourceYaml: string
    setResourceYaml: Dispatch<SetStateAction<string>>
    handleResize: () => void
    setResourceVersion: Dispatch<SetStateAction<string>>
    stale: boolean
    setStale: Dispatch<SetStateAction<boolean>>
  }>
) {
  const {
    cluster,
    kind,
    apiversion,
    name,
    namespace,
    isHubClusterResource,
    resourceYaml,
    setResourceYaml,
    handleResize,
    setResourceVersion,
    stale,
    setStale,
  } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string>('')

  useEffect(() => {
    // If there is an alert message to show -> resize the editor height to fit Alert component.
    handleResize()
  }, [handleResize, updateSuccess, updateError, stale])

  return (
    <div
      id={'yaml-editor-action-wrapper'}
      style={{
        borderTop: 'var(--pf-v5-global--BorderWidth--sm) solid var(--pf-v5-global--BorderColor--100)',
      }}
    >
      {updateSuccess || updateError || stale ? (
        <div
          style={{
            paddingTop: '1rem',
          }}
        >
          {updateSuccess && (
            <Alert id="editor-action-alert" variant={'success'} isInline={true} title={`${name} has been updated.`} />
          )}
          {updateError !== '' && (
            <Alert
              id="editor-action-alert"
              variant={'danger'}
              isInline={true}
              title={t('Error occurred while updating resource: {{name}}', { name })}
            >
              {updateError}
            </Alert>
          )}
          {stale && (
            <Alert id="editor-action-alert" isInline variant="info" title={t('This object has been updated.')}>
              {t('Click reload to see the new version.')}
            </Alert>
          )}
        </div>
      ) : undefined}
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
              onClick={() => {
                setUpdateError('')
                setUpdateSuccess(false)
                updateResource(
                  cluster,
                  kind,
                  apiversion,
                  name,
                  namespace,
                  resourceYaml,
                  isHubClusterResource,
                  setResourceYaml,
                  setUpdateError,
                  setUpdateSuccess,
                  setResourceVersion,
                  setStale,
                  isFineGrainedRbacEnabled
                )
              }}
            >
              {t('Save')}
            </Button>
          </ActionListItem>
          <ActionListItem>
            <Button
              variant="secondary"
              id="reload-resource-button"
              onClick={() => {
                loadResource(
                  cluster,
                  kind,
                  apiversion,
                  name,
                  namespace,
                  isHubClusterResource,
                  setResourceYaml,
                  setUpdateError,
                  setResourceVersion,
                  setStale,
                  isFineGrainedRbacEnabled
                )
                setUpdateError('')
                setUpdateSuccess(false)
              }}
            >
              {t('Reload')}
            </Button>
          </ActionListItem>
          <ActionListItem>
            <Button variant="secondary" id="cancel-resource-button" onClick={() => onCancel(navigate)}>
              {t('Cancel')}
            </Button>
          </ActionListItem>
        </ActionListGroup>
        <ActionListGroup>
          <ActionListItem>
            <Button
              variant="secondary"
              id="download-resource-button"
              icon={<DownloadIcon />}
              onClick={() => downloadYaml(name, resourceYaml)}
            >
              {t('Download')}
            </Button>
          </ActionListItem>
        </ActionListGroup>
      </ActionList>
    </div>
  )
}

export default function YAMLPage() {
  const {
    resource,
    resourceLoading,
    resourceError,
    isHubClusterResource,
    name,
    namespace,
    cluster,
    kind,
    apiversion,
    setResourceVersion,
  } = useSearchDetailsContext()
  const {
    multiclusterApi: { useFleetK8sWatchResource },
  } = useContext(PluginContext)
  const { t } = useTranslation()
  const [stale, setStale] = useState(false)
  const [userCanEdit, setUserCanEdit] = useState<boolean>(false)
  const [resourceYaml, setResourceYaml] = useState<string>('')
  const [defaultScrollToLine, setDefaultScrollToLine] = useState<number | undefined>()
  const [editorHeight, setEditorHeight] = useState(getEditorHeight())
  const location: {
    pathname: string
    state: {
      search?: string
      fromSearch?: string
      scrollToLine?: number
    }
  } = useLocation()

  // Watch a specific deployment on hub cluster
  const { apiGroup, version } = getGroupFromApiVersion(apiversion)
  const [resourceUpdate, watchLoaded, watchError] = useFleetK8sWatchResource({
    groupVersionKind: { group: apiGroup, version: version, kind },
    name,
    namespace,
    cluster,
  })

  useEffect(() => {
    const resourceWatchUpdate = resourceUpdate as FleetK8sResourceCommon
    if (watchError) {
      console.error(`Error starting watch for resource ${name}`)
    } else if (
      !watchError &&
      watchLoaded &&
      resourceWatchUpdate?.metadata?.resourceVersion &&
      resourceWatchUpdate?.metadata?.resourceVersion !== resource?.metadata?.resourceVersion
    ) {
      // if resourceVersion has updated set stale to true
      setStale(true)
    }
  }, [name, resourceUpdate, resource?.metadata?.resourceVersion, watchLoaded, watchError])

  useEffect(() => {
    if (location?.state?.scrollToLine) {
      setDefaultScrollToLine(location.state?.scrollToLine)
    }
  }, [location.state])

  useEffect(() => {
    if (resource) {
      setResourceYaml(jsYaml.dump(resource, { indent: 2 }))
      setEditorHeight(getEditorHeight())
    }
  }, [resource])

  function getEditorHeight() {
    const pageContentHeight = document.getElementsByClassName('pf-v5-c-page__main')[0]?.clientHeight
    const pageSectionHeader = document.getElementsByClassName('pf-v5-c-page__main-group')[0]?.clientHeight ?? 0
    const headerSectionHeight = document.getElementById('yaml-editor-header-wrapper')?.clientHeight ?? 0
    const actionsSectionHeight = document.getElementById('yaml-editor-action-wrapper')?.clientHeight ?? 0
    let editorHeight = pageContentHeight - pageSectionHeader - actionsSectionHeight - headerSectionHeight - 48 // 48px content padding
    const globalHeader = document.getElementsByClassName('co-global-notification')
    /* istanbul ignore if */
    if (globalHeader.length > 0) {
      editorHeight = editorHeight - globalHeader.length * 33
    }
    return editorHeight
  }

  const handleResize = useCallback(() => {
    setEditorHeight(getEditorHeight())
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    if (!resourceYaml) {
      return
    }
    const canUpdateResource = canUser(
      'update',
      {
        apiVersion: apiversion,
        kind,
        metadata: {
          name,
          namespace,
        },
      },
      isHubClusterResource ? namespace : cluster,
      name
    )

    canUpdateResource.promise
      .then((result) => setUserCanEdit(result.status?.allowed! ?? false))
      .catch((err) => console.error(err))
    return () => canUpdateResource.abort()
  }, [apiversion, cluster, resourceYaml, kind, name, namespace, isHubClusterResource])

  if (resourceError) {
    return (
      <PageSection>
        <Alert variant={'danger'} isInline={true} title={`${t('Error querying for resource:')} ${name}`}>
          {resourceError}
        </Alert>
      </PageSection>
    )
  } else if (resourceLoading) {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  return (
    <PageSection
      style={{
        position: 'relative',
        display: 'flex',
        height: '100%',
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <EditorHeaderBar cluster={cluster} namespace={namespace} />
      <YamlEditor
        resourceYAML={resourceYaml}
        readOnly={!userCanEdit}
        setResourceYaml={setResourceYaml}
        defaultScrollToLine={defaultScrollToLine}
        height={editorHeight}
      />
      <EditorActionBar
        cluster={cluster}
        kind={kind}
        apiversion={apiversion}
        name={name}
        namespace={namespace}
        isHubClusterResource={isHubClusterResource}
        resourceYaml={resourceYaml}
        setResourceYaml={setResourceYaml}
        handleResize={handleResize}
        setResourceVersion={setResourceVersion}
        stale={stale}
        setStale={setStale}
      />
    </PageSection>
  )
}
