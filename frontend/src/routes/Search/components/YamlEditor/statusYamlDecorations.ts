/* Copyright Contributors to the Open Cluster Management project */
import { Range } from 'monaco-editor'
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import * as yaml from 'yaml-ast-parser'
import {
  classifyCondition,
  STATUS_FAILURE_CLASS,
  STATUS_FAILURE_EMPHASIS_CLASS,
  STATUS_SUCCESS_CLASS,
  STATUS_SUCCESS_EMPHASIS_CLASS,
  type ConditionLike,
} from '../../../../components/SyncEditor/statusDecorations'

type YamlNode = {
  key?: { value?: string; startPosition?: number; endPosition?: number }
  value?: YamlNode | string | number | boolean
  mappings?: YamlNode[]
  items?: YamlNode[]
  startPosition?: number
  endPosition?: number
}

function asMap(node: YamlNode | string | number | boolean | undefined): YamlNode | undefined {
  if (node == null || typeof node !== 'object') return undefined
  return node
}

function scalarValue(node: YamlNode | string | number | boolean | undefined): string | undefined {
  if (node == null) return undefined
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node)
  }
  if (typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') {
    return String(node.value)
  }
  return undefined
}

function mappingField(mapNode: YamlNode | undefined, field: string): YamlNode | undefined {
  return mapNode?.mappings?.find((m) => m.key?.value === field)
}

function pushRangeDecoration(
  model: monaco.editor.ITextModel,
  decorations: monaco.editor.IModelDeltaDecoration[],
  node: YamlNode | undefined,
  className: string
) {
  if (!node || node.startPosition == null || node.endPosition == null) return
  const start = model.getPositionAt(node.startPosition)
  const end = model.getPositionAt(node.endPosition)
  decorations.push({
    range: new Range(start.lineNumber, start.column, end.lineNumber, end.column),
    options: {
      inlineClassName: className,
      description: 'search-yaml-status',
    },
  })
}

function decorateCondition(
  model: monaco.editor.ITextModel,
  conditionNode: YamlNode,
  decorations: monaco.editor.IModelDeltaDecoration[]
) {
  const conditionMap = asMap(conditionNode.value) ?? conditionNode
  const typeNode = mappingField(conditionMap, 'type')
  const statusNode = mappingField(conditionMap, 'status')
  const reasonNode = mappingField(conditionMap, 'reason')
  const messageNode = mappingField(conditionMap, 'message')

  const condition: ConditionLike = {
    type: scalarValue(typeNode?.value ?? typeNode),
    status: scalarValue(statusNode?.value ?? statusNode),
    reason: scalarValue(reasonNode?.value ?? reasonNode),
    message: scalarValue(messageNode?.value ?? messageNode),
  }

  const outcome = classifyCondition(condition)
  if (outcome === 'neutral') return

  const blockClass = outcome === 'success' ? STATUS_SUCCESS_CLASS : STATUS_FAILURE_CLASS
  const emphasisClass = outcome === 'success' ? STATUS_SUCCESS_EMPHASIS_CLASS : STATUS_FAILURE_EMPHASIS_CLASS

  pushRangeDecoration(model, decorations, conditionNode, blockClass)
  pushRangeDecoration(model, decorations, reasonNode, emphasisClass)
  pushRangeDecoration(model, decorations, messageNode, emphasisClass)
}

function decorateStatusMap(
  model: monaco.editor.ITextModel,
  statusMap: YamlNode,
  decorations: monaco.editor.IModelDeltaDecoration[]
) {
  const unavailable = mappingField(statusMap, 'unavailableReplicas')
  if (unavailable) {
    const raw = scalarValue(unavailable.value ?? unavailable)
    const numeric = Number(raw)
    if (Number.isFinite(numeric) && numeric > 0) {
      pushRangeDecoration(model, decorations, unavailable, STATUS_FAILURE_CLASS)
    }
  }

  const conditions = mappingField(statusMap, 'conditions')
  const conditionsValue = asMap(conditions?.value)
  const conditionItems = conditionsValue?.items ?? (conditions as YamlNode | undefined)?.items
  if (Array.isArray(conditionItems)) {
    for (const item of conditionItems) {
      decorateCondition(model, item, decorations)
    }
  }

  const containerStatuses = mappingField(statusMap, 'containerStatuses')
  const containerStatusesValue = asMap(containerStatuses?.value)
  const containerItems = containerStatusesValue?.items ?? (containerStatuses as YamlNode | undefined)?.items
  if (Array.isArray(containerItems)) {
    for (const container of containerItems) {
      const containerMap = asMap(container.value) ?? container
      const lastState = mappingField(containerMap, 'lastState')
      const lastStateMap = asMap(lastState?.value) ?? lastState
      const terminated = mappingField(lastStateMap, 'terminated')
      const terminatedMap = asMap(terminated?.value) ?? terminated
      const reason = mappingField(terminatedMap, 'reason')
      if (scalarValue(reason?.value ?? reason) === 'Error') {
        pushRangeDecoration(model, decorations, lastState, STATUS_FAILURE_CLASS)
      }
    }
  }
}

/**
 * Build Monaco decorations for status fields in Search YAML editor content.
 */
export function getSearchYamlStatusDecorations(model: monaco.editor.ITextModel): monaco.editor.IModelDeltaDecoration[] {
  const decorations: monaco.editor.IModelDeltaDecoration[] = []
  let doc: YamlNode
  try {
    doc = yaml.safeLoad(model.getValue()) as YamlNode
  } catch {
    return decorations
  }

  const statusField = doc?.mappings?.find((m) => m.key?.value === 'status')
  const statusMap = statusField?.value
  if (statusMap) {
    decorateStatusMap(model, statusMap, decorations)
  }
  return decorations
}

/**
 * Apply (and refresh) status decorations on a Search YAML Monaco editor.
 * Returns a disposer that clears decorations and removes the content listener.
 */
export function registerSearchYamlStatusDecorations(editor: monaco.editor.IStandaloneCodeEditor): () => void {
  let decorationIds: string[] = []
  const refresh = () => {
    const model = editor.getModel()
    if (!model) return
    decorationIds = editor.deltaDecorations(decorationIds, getSearchYamlStatusDecorations(model))
  }
  refresh()
  const disposable = editor.onDidChangeModelContent(() => refresh())
  return () => {
    disposable.dispose()
    decorationIds = editor.deltaDecorations(decorationIds, [])
  }
}
