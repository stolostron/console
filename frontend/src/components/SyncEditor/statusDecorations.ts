/* Copyright Contributors to the Open Cluster Management project */
import type { Monaco } from '@monaco-editor/react'
import type { editor as editorTypes } from 'monaco-editor'

export type ConditionOutcome = 'success' | 'failure' | 'neutral'

export const STATUS_SUCCESS_CLASS = 'statusConditionSuccess'
export const STATUS_SUCCESS_EMPHASIS_CLASS = 'statusConditionSuccessEmphasis'
export const STATUS_FAILURE_CLASS = 'statusConditionFailure'
export const STATUS_FAILURE_EMPHASIS_CLASS = 'statusConditionFailureEmphasis'

const CONDITION_KEY_ORDER = ['type', 'status', 'reason', 'message'] as const
const STATUS_TAIL_KEYS = ['conditions', 'containerStatuses'] as const

/** Condition types where status True means a problem (negative polarity). */
const NEGATIVE_POLARITY_PATTERN = /(degraded|fail|error|pressure|unhealthy|unavailable|disruption|conflict|stalled)/i

export interface ConditionLike {
  type?: string
  status?: string
  reason?: string
  message?: string
}

export function isNegativePolarityCondition(type: string | undefined): boolean {
  if (!type) return false
  return NEGATIVE_POLARITY_PATTERN.test(type)
}

/**
 * Classify a Kubernetes-style condition as success or failure.
 * Mirrors the polarity rules used in ConditionsTable (Ready vs Degraded, etc.).
 */
export function classifyCondition(condition: ConditionLike): ConditionOutcome {
  const type = condition.type ?? ''
  const status = condition.status
  if (status !== 'True' && status !== 'False') {
    return 'neutral'
  }

  const negative = isNegativePolarityCondition(type)
  const progressing = /progressing/i.test(type)

  if (progressing) {
    // In-progress is treated as success (green) per story scope (no third tint).
    return 'success'
  }

  if (negative) {
    return status === 'True' ? 'failure' : 'success'
  }

  // Positive polarity (Ready, Available, …)
  if (status === 'True') {
    return 'success'
  }

  // False on positive polarity — unless reason says AsExpected (e.g. some Hypershift conditions)
  if (condition.reason === 'AsExpected') {
    return 'success'
  }

  return 'failure'
}

/**
 * Whether a container lastState.terminated should be highlighted as failure.
 * Covers reason: Error (ACM-38199) plus common non-success terminations and non-zero exitCode.
 */
export function isTerminatedContainerFailure(terminated: {
  reason?: unknown
  exitCode?: unknown
}): boolean {
  const reason = typeof terminated.reason === 'string' ? terminated.reason : String(terminated.reason ?? '')
  if (reason === 'Completed') {
    return false
  }
  const exitCode =
    typeof terminated.exitCode === 'number' ? terminated.exitCode : Number(terminated.exitCode)
  if (Number.isFinite(exitCode) && exitCode !== 0) {
    return true
  }
  return /^(Error|OOMKilled|ContainerCannotRun|DeadlineExceeded|Evicted)$/i.test(reason)
}

const DANGEROUS_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function compareConditionKeys(a: string, b: string): number {
  const ai = CONDITION_KEY_ORDER.indexOf(a as (typeof CONDITION_KEY_ORDER)[number])
  const bi = CONDITION_KEY_ORDER.indexOf(b as (typeof CONDITION_KEY_ORDER)[number])
  const aIn = ai >= 0
  const bIn = bi >= 0
  if (aIn && bIn) return ai - bi
  if (aIn) return -1
  if (bIn) return 1
  return a.localeCompare(b)
}

/**
 * Under status: other keys alphabetically first, then conditions, then containerStatuses.
 */
export function compareStatusKeys(a: string, b: string): number {
  const ai = STATUS_TAIL_KEYS.indexOf(a as (typeof STATUS_TAIL_KEYS)[number])
  const bi = STATUS_TAIL_KEYS.indexOf(b as (typeof STATUS_TAIL_KEYS)[number])
  const aTail = ai >= 0
  const bTail = bi >= 0
  if (aTail && bTail) return ai - bi
  if (aTail) return 1
  if (bTail) return -1
  return a.localeCompare(b)
}

function compareGenericKeys(a: string, b: string): number {
  const preferred = ['name', 'namespace']
  const ai = preferred.indexOf(a)
  const bi = preferred.indexOf(b)
  const aIn = ai >= 0
  const bIn = bi >= 0
  if (aIn && bIn) return ai - bi
  if (aIn) return -1
  if (bIn) return 1
  return a.localeCompare(b)
}

function reorderObjectKeys(
  obj: Record<string, unknown>,
  compare: (a: string, b: string) => number
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort(compare)) {
    if (DANGEROUS_OBJECT_KEYS.has(key)) continue
    ordered[key] = obj[key]
  }
  return ordered
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function looksLikeCondition(obj: Record<string, unknown>): boolean {
  return typeof obj.type === 'string' && (obj.status === 'True' || obj.status === 'False' || obj.status === 'Unknown')
}

/**
 * Deep-clone a resource and reorder status / condition keys for YAML display.
 */
export function prepareResourceForYaml(resource: unknown): unknown {
  return walkReorder(resource, 'root')
}

function walkReorder(node: unknown, parentKey: string): unknown {
  if (Array.isArray(node)) {
    const childContext =
      parentKey === 'conditions' ? 'conditionItem' : parentKey === 'containerStatuses' ? 'containerStatus' : 'root'
    return node.map((item) => walkReorder(item, childContext))
  }
  if (!isPlainObject(node)) {
    return node
  }

  const walked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (DANGEROUS_OBJECT_KEYS.has(key)) continue
    walked[key] = walkReorder(value, key)
  }

  if (parentKey === 'status') {
    return reorderObjectKeys(walked, compareStatusKeys)
  }
  if (parentKey === 'conditionItem' || looksLikeCondition(walked)) {
    return reorderObjectKeys(walked, compareConditionKeys)
  }
  return reorderObjectKeys(walked, compareGenericKeys)
}

export function prepareResourcesForYaml(resources: unknown[]): unknown[] {
  return resources.map((resource) => prepareResourceForYaml(resource))
}

/** SyncEditor YAML mapping leaf (line/range metadata produced by the editor parser). */
export type StatusMappingLeaf = {
  $k?: string
  $r?: number
  $l?: number
  $v?: unknown
  $gv?: { start: { line: number; column?: number; col?: number }; end: { line: number; column?: number; col?: number } }
}

function mappingRange(
  leaf: StatusMappingLeaf | undefined
): { startLine: number; endLine: number; startCol: number; endCol: number } | null {
  if (!leaf) return null
  if (leaf.$gv) {
    return {
      startLine: leaf.$gv.start.line,
      startCol: leaf.$gv.start.column ?? leaf.$gv.start.col ?? 1,
      endLine: leaf.$gv.end.line,
      endCol: leaf.$gv.end.column ?? leaf.$gv.end.col ?? 132,
    }
  }
  if (leaf.$r != null) {
    const lines = leaf.$l ?? 1
    return {
      startLine: leaf.$r,
      startCol: 1,
      endLine: leaf.$r + Math.max(0, lines - 1),
      endCol: 132,
    }
  }
  return null
}

function pushDecoration(
  monaco: Monaco,
  decorations: editorTypes.IModelDeltaDecoration[],
  leaf: StatusMappingLeaf | undefined,
  className: string
) {
  const range = mappingRange(leaf)
  if (!range) return
  decorations.push({
    range: new monaco.Range(range.startLine, range.startCol, range.endLine, range.endCol),
    options: {
      inlineClassName: className,
    },
  })
}

function conditionFieldsFromMapping(conditionMapping: StatusMappingLeaf): ConditionLike {
  const fields = (conditionMapping.$v ?? {}) as Record<string, StatusMappingLeaf | string>
  const read = (key: string): string | undefined => {
    const field = fields[key]
    if (field && typeof field === 'object' && '$v' in field) {
      return field.$v as string | undefined
    }
    if (typeof field === 'string') return field
    return undefined
  }
  return {
    type: read('type'),
    status: read('status'),
    reason: read('reason'),
    message: read('message'),
  }
}

function decorateConditionMapping(
  monaco: Monaco,
  conditionMapping: StatusMappingLeaf,
  decorations: editorTypes.IModelDeltaDecoration[]
) {
  const outcome = classifyCondition(conditionFieldsFromMapping(conditionMapping))
  if (outcome === 'neutral') return

  const blockClass = outcome === 'success' ? STATUS_SUCCESS_CLASS : STATUS_FAILURE_CLASS
  const emphasisClass = outcome === 'success' ? STATUS_SUCCESS_EMPHASIS_CLASS : STATUS_FAILURE_EMPHASIS_CLASS

  pushDecoration(monaco, decorations, conditionMapping, blockClass)

  const fields = (conditionMapping.$v ?? {}) as Record<string, StatusMappingLeaf>
  pushDecoration(monaco, decorations, fields.reason, emphasisClass)
  pushDecoration(monaco, decorations, fields.message, emphasisClass)
}

function decorateUnavailableReplicas(
  monaco: Monaco,
  statusMapping: StatusMappingLeaf,
  decorations: editorTypes.IModelDeltaDecoration[]
) {
  const statusFields = (statusMapping.$v ?? {}) as Record<string, StatusMappingLeaf>
  const unavailable = statusFields.unavailableReplicas
  if (!unavailable) return
  const value = unavailable.$v
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return
  pushDecoration(monaco, decorations, unavailable, STATUS_FAILURE_CLASS)
}

function decorateLastStateErrors(
  monaco: Monaco,
  containerStatusesMapping: StatusMappingLeaf | undefined,
  decorations: editorTypes.IModelDeltaDecoration[]
) {
  if (!containerStatusesMapping || !Array.isArray(containerStatusesMapping.$v)) return
  for (const containerStatus of containerStatusesMapping.$v as StatusMappingLeaf[]) {
    const fields = (containerStatus.$v ?? {}) as Record<string, StatusMappingLeaf>
    const lastState = fields.lastState
    if (!lastState || !isPlainObject(lastState.$v)) continue
    const lastStateFields = lastState.$v as Record<string, StatusMappingLeaf>
    const terminated = lastStateFields.terminated
    if (!terminated || !isPlainObject(terminated.$v)) continue
    const terminatedFields = terminated.$v as Record<string, StatusMappingLeaf>
    if (
      isTerminatedContainerFailure({
        reason: terminatedFields.reason?.$v,
        exitCode: terminatedFields.exitCode?.$v,
      })
    ) {
      pushDecoration(monaco, decorations, lastState, STATUS_FAILURE_CLASS)
    }
  }
}

/**
 * Build Monaco decorations for status.conditions / unavailableReplicas / lastState from SyncEditor mappings.
 */
export function getStatusDecorationsFromMappings(
  monaco: Monaco,
  mappings: { [name: string]: StatusMappingLeaf[] | any[] } | undefined
): editorTypes.IModelDeltaDecoration[] {
  const decorations: editorTypes.IModelDeltaDecoration[] = []
  if (!mappings) return decorations

  for (const resources of Object.values(mappings)) {
    if (!Array.isArray(resources)) continue
    for (const resourceMapping of resources) {
      const statusMapping = (resourceMapping as Record<string, StatusMappingLeaf>).status
      if (!statusMapping) continue

      decorateUnavailableReplicas(monaco, statusMapping, decorations)

      const statusFields = (statusMapping.$v ?? {}) as Record<string, StatusMappingLeaf>
      const conditionsMapping = statusFields.conditions
      if (conditionsMapping && Array.isArray(conditionsMapping.$v)) {
        for (const conditionMapping of conditionsMapping.$v as StatusMappingLeaf[]) {
          decorateConditionMapping(monaco, conditionMapping, decorations)
        }
      }

      decorateLastStateErrors(monaco, statusFields.containerStatuses, decorations)
    }
  }

  return decorations
}

export const STATUS_DECORATION_CLASS_NAMES = [
  STATUS_SUCCESS_CLASS,
  STATUS_SUCCESS_EMPHASIS_CLASS,
  STATUS_FAILURE_CLASS,
  STATUS_FAILURE_EMPHASIS_CLASS,
] as const

export function isStatusDecorationClass(className: string | undefined): boolean {
  return !!className && (STATUS_DECORATION_CLASS_NAMES as readonly string[]).includes(className)
}
