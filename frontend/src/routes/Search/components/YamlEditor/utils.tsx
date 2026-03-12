/* Copyright Contributors to the Open Cluster Management project */
import jsYaml from 'js-yaml'
import { Range } from 'monaco-editor'
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import * as yaml from 'yaml-ast-parser'
import { IResource } from '../../../../resources'
import { getBackendUrl, getRequest, getResource, putRequest, replaceResource } from '../../../../resources/utils'
import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'

// https://github.com/openshift/console/blob/main/frontend/packages/console-shared/src/components/editor/yaml-editor-utils.ts#L14
const findManagedMetadata = (model: monaco.editor.ITextModel) => {
  const modelValue = model.getValue()
  let doc
  try {
    doc = yaml.safeLoad(modelValue)
  } catch {
    return { start: -1, end: -1 }
  }
  const rootMappings = doc?.mappings || []
  for (const rootElement of rootMappings) {
    const rootKey = rootElement.key
    const rootValue = rootElement.value

    // Search for metadata
    if (rootKey.value === 'metadata') {
      const metadataMappings = rootValue.mappings || []
      for (const metadataChildren of metadataMappings) {
        const childKey = metadataChildren.key

        // Search for managedFields
        if (childKey.value === 'managedFields') {
          const startLine = model.getPositionAt(metadataChildren.startPosition).lineNumber
          const endLine = model.getPositionAt(metadataChildren.endPosition).lineNumber
          return {
            start: startLine,
            end: endLine,
          }
        }
      }
    }
  }
  return {
    start: -1,
    end: -1,
  }
}

// https://github.com/openshift/console/blob/main/frontend/packages/console-shared/src/components/editor/yaml-editor-utils.ts#L46
export const fold = (
  editor: monaco.editor.IStandaloneCodeEditor,
  model: monaco.editor.ITextModel,
  resetMouseLocation: boolean
): void => {
  const managedLocation = findManagedMetadata(model)
  const { start } = managedLocation
  const { end } = managedLocation

  if (start >= 0 && end >= 0) {
    const top = editor.getScrollTop()
    editor.setSelection(new Range(start, 0, end, 0))
    editor
      .getAction('editor.fold')
      .run()
      .then(() => {
        if (resetMouseLocation) {
          editor.setSelection(new Range(0, 0, 0, 0))
        }
        editor.setScrollTop(Math.abs(top))
      })
      .catch(() => {})
  }
}

/**
 * Register for automatic managedFields folding in the editor
 * https://github.com/openshift/console/blob/main/frontend/packages/console-shared/src/components/editor/yaml-editor-utils.ts#L74
 */
export const registerAutoFold = (editor: monaco.editor.IStandaloneCodeEditor) => {
  let initialFoldingTriggered = false
  const model = editor.getModel()
  const tryFolding = () => {
    const document = model?.getValue()
    if (model && !initialFoldingTriggered && document !== '') {
      setTimeout(() => fold(editor, model, true))
      initialFoldingTriggered = true
    }
  }
  tryFolding()

  model?.onDidChangeContent(() => {
    tryFolding()
  })
}

export function onReload(
  cluster: string,
  kind: string,
  apiversion: string,
  name: string,
  namespace: string,
  isHubClusterResource: boolean,
  setResourceYaml: Dispatch<SetStateAction<string>>,
  setUpdateError: Dispatch<SetStateAction<string>>,
  setStale: Dispatch<SetStateAction<boolean>>,
  isFineGrainedRbacEnabled: boolean,
  shouldFoldAfterReloadRef: MutableRefObject<boolean>
) {
  if (isFineGrainedRbacEnabled && (kind === 'VirtualMachine' || kind === 'VirtualMachineSnapshot')) {
    const url = getBackendUrl() + `/${kind.toLowerCase()}s/get/${cluster}/${name}/${namespace}` // need the plural kind either virtualmachines || virtualmachinesnapshots
    getRequest<IResource>(url)
      .promise.then((response) => {
        shouldFoldAfterReloadRef.current = true
        setResourceYaml(jsYaml.dump(response, { indent: 2 }))
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
        shouldFoldAfterReloadRef.current = true
        setResourceYaml(jsYaml.dump(response, { indent: 2 }))
        setStale(false)
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setUpdateError(`Error getting new resource YAML: ${err.message}`)
      })
  } else {
    fleetResourceRequest('GET', cluster, {
      apiVersion: apiversion,
      kind,
      name,
      namespace,
    })
      .then((res) => {
        if ('errorMessage' in res) {
          setUpdateError(`Error getting new resource YAML: ${res.errorMessage}`)
        } else {
          shouldFoldAfterReloadRef.current = true
          setResourceYaml(jsYaml.dump(res))
          setStale(false)
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
        setUpdateError(`Error getting new resource YAML: ${err.message}`)
      })
  }
}

export function onSave(
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
  setStale: Dispatch<SetStateAction<boolean>>,
  isFineGrainedRbacEnabled: boolean,
  shouldFoldAfterReloadRef: MutableRefObject<boolean>
) {
  if (isFineGrainedRbacEnabled && (kind === 'VirtualMachine' || kind === 'VirtualMachineSnapshot')) {
    const url = getBackendUrl() + `/${kind.toLowerCase()}s/update` // need the plural kind either virtualmachines || virtualmachinesnapshots
    const parsedYaml = jsYaml.load(resourceYaml) as IResource
    putRequest(url, {
      reqBody: parsedYaml,
      managedCluster: cluster,
      vmName: name,
      vmNamespace: namespace,
    })
      .promise.then(() => setUpdateSuccess(true))
      .catch((err) => {
        console.error('Error updating resource: ', err)
        setUpdateError(err.message)
      })
  } else if (isHubClusterResource) {
    try {
      const parsedYaml = jsYaml.load(resourceYaml) as IResource
      replaceResource(parsedYaml)
        .promise.then(() => {
          onReload(
            cluster,
            kind,
            apiversion,
            name,
            namespace,
            isHubClusterResource,
            setResourceYaml,
            setUpdateError,
            setStale,
            isFineGrainedRbacEnabled,
            shouldFoldAfterReloadRef
          )
          setUpdateSuccess(true)
        })
        .catch((err) => {
          console.error('Error updating resource: ', err)
          setUpdateError(err.message)
        })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Error updating resource: ', message)
      setUpdateError(message)
    }
  } else {
    fleetResourceRequest(
      'PUT',
      cluster,
      { apiVersion: apiversion, kind, name, namespace },
      jsYaml.loadAll(resourceYaml)[0]
    )
      .then((res) => {
        if ('errorMessage' in res) {
          setUpdateError(res.errorMessage)
        } else {
          onReload(
            cluster,
            kind,
            apiversion,
            name,
            namespace,
            isHubClusterResource,
            setResourceYaml,
            setUpdateError,
            setStale,
            isFineGrainedRbacEnabled,
            shouldFoldAfterReloadRef
          )
          setUpdateSuccess(true)
        }
      })
      .catch((err) => {
        console.error('Error updating resource: ', err)
        setUpdateError(String(err))
      })
  }
}
