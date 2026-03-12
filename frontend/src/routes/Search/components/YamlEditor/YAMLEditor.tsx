import { Monaco } from '@monaco-editor/react'
import { CodeEditorRef } from '@openshift-console/dynamic-plugin-sdk'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  AlertGroup,
  Button,
  getResizeObserver,
  PageSection,
} from '@patternfly/react-core'
import { DownloadIcon } from '@patternfly/react-icons'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import saveAs from 'file-saver'
import jsYaml from 'js-yaml'
import type { editor } from 'monaco-editor'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { defineThemes, getTheme, mountTheme } from '../../../../components/theme'
import { useTranslation } from '../../../../lib/acm-i18next'
import { PluginContext } from '../../../../lib/PluginContext'
import { canUser } from '../../../../lib/rbac-util'
import { getGroupFromApiVersion } from '../../../../resources/utils'
import { fleetCanUser } from '../../../../resources/utils/fleet-can-user'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { fold, onReload, onSave, registerAutoFold } from './utils'

/**
 * YAML editor page modeled after the OpenShift console edit-yaml component.
 * https://github.com/openshift/console/blob/24830e32f72e7da9cb20fd34dd6be5c13fdf126e/frontend/public/components/edit-yaml.tsx
 */
export default function YAMLEditor(props: {
  resource: any
  cluster: string
  kind: string
  apiVersion: string
  name: string
  namespace: string
  isHubClusterResource: boolean
}) {
  const { resource, cluster, kind, apiVersion, name, namespace, isHubClusterResource } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    multiclusterApi: { useFleetK8sWatchResource },
  } = useContext(PluginContext)
  const [monacoRef, setMonacoRef] = useState<CodeEditorRef['monaco'] | null>(null)
  const [editorRef, setEditorRef] = useState<CodeEditorRef['editor'] | null>(null)
  const [resourceYaml, setResourceYaml] = useState('')
  const [stale, setStale] = useState(false)
  const [readOnly, setReadOnly] = useState(true)
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const { apiGroup, version } = getGroupFromApiVersion(apiVersion)
  const [resourceUpdate, watchLoaded, watchError] = useFleetK8sWatchResource({
    groupVersionKind: { group: apiGroup, version, kind },
    name,
    namespace,
    cluster,
  })
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string>('')
  const shouldFoldAfterReloadRef = useRef(false)
  const [valueHasChanged, setValueHasChanged] = useState(false)

  function onEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    setMonacoRef(monaco)
    setEditorRef(editor)
    editor.layout()
    editor.focus()
    monaco.editor.getModels()[0].updateOptions({ tabSize: 5 })

    // Auto collapse the managedFields section
    registerAutoFold(editor)

    // make sure this instance of monaco editor has the ocp console themes
    defineThemes(monaco?.editor)

    // if we don't reset the themes to vs
    // and console-light or console-dark were set, monaco wouldn't
    // update the 'monoco-colors' style with the right colors
    monaco?.editor?.setTheme('vs')
    monaco?.editor?.setTheme(getTheme())

    // show SyncEditor version of monaco-colors
    mountTheme('se')

    // observe documentElement class changes (theme toggles)
    if (typeof MutationObserver !== 'undefined') {
      const classObserver = new MutationObserver(() => {
        monaco?.editor?.setTheme(getTheme())
        ;(window as any).monaco?.editor?.setTheme(getTheme())
      })
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    window.getEditorValue = () => editor.getValue()
  }

  useEffect(() => {
    if (resource) {
      setResourceYaml(jsYaml.dump(resource, { indent: 2 }))
    }
  }, [resource])

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
  }, [watchedResource, resource?.metadata?.resourceVersion, watchLoaded, watchError])

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
  }, [apiVersion, cluster, kind, name, namespace, isHubClusterResource])

  // recalculate bounds when viewport is changed
  const handleResize = useCallback(() => {
    monacoRef?.editor?.getEditors()?.forEach((editor) => {
      editor.layout({ width: 0, height: 0 })
      editor.layout()
    })
  }, [monacoRef])

  useEffect(() => {
    handleResize()
  }, [handleResize, updateSuccess, updateError, stale])

  useEffect(() => {
    // @ts-expect-error getResizeObserver expects Element; undefined used to observe viewport
    const observer = getResizeObserver(undefined, handleResize, true)
    return () => observer()
  }, [handleResize])

  useEffect(() => {
    handleResize()
  }, [handleResize])

  // Run fold after reload once the CodeEditor has applied the new resourceYaml to the model.
  useEffect(() => {
    if (shouldFoldAfterReloadRef.current === false || !editorRef) {
      setValueHasChanged(false)
      return
    }
    shouldFoldAfterReloadRef.current = false
    const model = editorRef.getModel()
    if (!model || !valueHasChanged) return
    const id = requestAnimationFrame(() => {
      fold(editorRef!, model, false)
    })
    setValueHasChanged(false)
    return () => cancelAnimationFrame(id)
    // only fire fold if the resourceYaml has changed due to onReload/onSave call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceYaml, editorRef])

  function downloadYaml(fileName: string, content: string) {
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' })
    saveAs(blob, `${fileName}.yaml`)
  }

  return (
    <PageSection
      hasBodyWrapper={false}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        gap: 0,
        position: 'relative',
      }}
    >
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }} className="ocs-yaml-editor">
        <CodeEditor
          isCopyEnabled={true}
          code={resourceYaml}
          onChange={(value) => {
            setResourceYaml(value)
            setValueHasChanged(true)
          }}
          language={Language.yaml}
          onEditorDidMount={(editor, monaco) => onEditorDidMount(editor, monaco)}
          isFullHeight={true}
          isDarkTheme={getTheme() === 'console-dark'}
        />
      </div>
      <div className="yaml-editor__buttons">
        {(updateSuccess || updateError || stale) && (
          <AlertGroup style={{ paddingBottom: '1rem' }}>
            {updateSuccess && (
              <Alert id="editor-action-alert" isInline variant="success" title={`${name} ${t('has been updated.')}`} />
            )}
            {updateError !== '' && (
              <Alert
                id="editor-action-alert"
                isInline
                variant="danger"
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
                isDisabled={readOnly}
                onClick={() => {
                  shouldFoldAfterReloadRef.current = true
                  setUpdateError('')
                  setUpdateSuccess(false)
                  onSave(
                    cluster,
                    kind,
                    apiVersion,
                    name,
                    namespace,
                    resourceYaml,
                    isHubClusterResource,
                    setResourceYaml,
                    setUpdateError,
                    setUpdateSuccess,
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
                  shouldFoldAfterReloadRef.current = true
                  onReload(
                    cluster,
                    kind,
                    apiVersion,
                    name,
                    namespace,
                    isHubClusterResource,
                    setResourceYaml,
                    setUpdateError,
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
              <Button
                variant="secondary"
                id="cancel-resource-button"
                data-test="cancel-resource-button"
                isDisabled={readOnly}
                onClick={() => {
                  // OCP returns to previous page
                  // We could instead revert any changes and remain on the page || if no changes then go back to previous page?
                  navigate(-1)
                }}
              >
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
    </PageSection>
  )
}
