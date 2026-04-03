/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { IRange } from 'monaco-editor'
import { Monaco } from '@monaco-editor/react'
import { getPathArray } from './synchronize'

type MappingLeaf = {
  $gv?: { start: { line: number; column?: number; col?: number }; end: { line: number; column?: number; col?: number } }
  $r?: number
  $l?: number
}

function startCol(gv: MappingLeaf['$gv']): number {
  if (!gv) return 1
  return gv.start.column ?? gv.start.col ?? 1
}

function endCol(gv: NonNullable<MappingLeaf['$gv']>): number {
  return gv.end.column ?? gv.end.col ?? 1
}

function mappingLeafToRange(monaco: Monaco, m: MappingLeaf | undefined | null): IRange | null {
  if (!m) return null
  if (m.$gv) {
    return new monaco.Range(m.$gv.start.line, startCol(m.$gv), m.$gv.end.line, endCol(m.$gv))
  }
  if (m.$r != null) {
    const lines = m.$l ?? 1
    return new monaco.Range(m.$r, 1, m.$r + Math.max(0, lines - 1), 999)
  }
  return null
}

/**
 * Resolves a wizard review / form dot path to a Monaco range using SyncEditor `change.paths` and `mappings`.
 */
export function rangeForHighlightPath(
  monaco: Monaco,
  paths: Record<string, MappingLeaf> | undefined,
  mappings: Record<string, unknown[]> | undefined,
  highlightEditorPath: string
): IRange | null {
  const clean = highlightEditorPath.replace(/;id=[^;]*$/u, '').trim()
  if (!clean || !mappings) return null

  const segments = clean.split('.').filter(Boolean)
  if (segments.length === 0) return null

  const tryKind = (kind: string, restSegments: string[]): IRange | null => {
    const arr = mappings[kind]
    if (!Array.isArray(arr)) return null
    const rest = restSegments.join('.')
    for (let i = 0; i < arr.length; i++) {
      const pathKey = rest ? `${kind}.${i}.${rest}` : `${kind}.${i}`
      const fromPaths = paths?.[pathKey]
      const r = mappingLeafToRange(monaco, fromPaths)
      if (r) return r
      const root = arr[i] as Record<string, unknown> | undefined
      if (root && rest) {
        const inner = get(root, getPathArray(rest)) as MappingLeaf | undefined
        const r2 = mappingLeafToRange(monaco, inner)
        if (r2) return r2
      }
    }
    return null
  }

  const kind = segments[0]!
  if (mappings[kind]) {
    return tryKind(kind, segments.slice(1))
  }
  for (const k of Object.keys(mappings)) {
    const r = tryKind(k, segments)
    if (r) return r
  }
  return null
}
