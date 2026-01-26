/* Copyright Contributors to the Open Cluster Management project */

import get from 'get-value'
import { ReactNode } from 'react'

export function getLatest<T>(items: T[], key: string) {
  if (items.length === 0) {
    return undefined
  }
  const [firstItem, ...rest] = items

  return rest.reduce((a, b) => {
    const [timeA, timeB] = [a, b].map((x: T) => new Date(get(x as unknown as object, key, '')))
    return timeA > timeB ? a : b
  }, firstItem)
}

/* istanbul ignore next */
export const createDownloadFile = (filename: string, content: string, type?: string) => {
  const a = document.createElement('a')
  const blob = new Blob([content], { type: type || 'text/plain' })
  const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  a.dispatchEvent(event)
  window.URL.revokeObjectURL(url)
}

export function getCookie(name: string) {
  if (!document?.cookie) return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts[parts.length - 1]
    if (cookie) return cookie.split(';').shift()
  }
}

export function getGroupFromApiVersion(apiVersion: string) {
  if (apiVersion.indexOf('/') >= 0) {
    return { apiGroup: apiVersion.split('/')[0], version: apiVersion.split('/')[1] }
  }
  return { apiGroup: '', version: apiVersion }
}

export function exportObjectString(object: Record<string, string>) {
  const keyValueMap = Object.keys(object).map((key) => {
    return `'${key}':'${object[key]}'`
  })
  return keyValueMap.toString()
}

export function returnCSVSafeString(exportValue: string | ReactNode) {
  // extract newlines
  return `"${typeof exportValue === 'string' ? exportValue.split('\n').join(' ').replaceAll('"', '""') : exportValue}"`
}

export const getISOStringTimestamp = (timestamp: string) => {
  return new Date(timestamp).toISOString()
}

export function parseLabel(label?: string | null) {
  let prefix, oper, suffix
  if (label?.includes('=')) {
    ;[prefix, suffix] = label.split('=')
    if (prefix.endsWith('!')) {
      prefix = prefix.slice(0, -1)
      oper = '!='
    } else {
      oper = '='
    }
  }
  return { prefix, oper, suffix }
}

export function matchesFilterValue(supportsInequality: boolean, label: string, filterLabel: string | null) {
  if (supportsInequality) {
    const p = parseLabel(filterLabel)
    return label === `${p.prefix}=${p.suffix}`
  } else {
    return label === filterLabel
  }
}

interface FilterableItem {
  id?: string
  uid?: string
}

export interface LabelMap {
  [key: string]: {
    pairs?: Record<string, string>
    labels?: string[]
  }
}

export const filterLabelFn = (selectedValues: string[], item: FilterableItem, labelMap: LabelMap) => {
  // if no filters, let all items thru
  if (!selectedValues.length) return true
  // if all fillters have != thru all items that don't have that label
  const allInequity = selectedValues.every((val: string) => {
    return val.includes('!=')
  })
  const labels = labelMap?.[item.id as string]?.labels || labelMap?.[item.uid as string]?.labels || []
  if (allInequity) {
    return selectedValues.every((val: string) => {
      const p = parseLabel(val)
      return !labels.includes(`${p.prefix}=${p.suffix}`)
    })
  } else {
    // else if an item has a match, but doen't have a !=, let it thru
    let hasEquity = false
    let hasInequity = false
    selectedValues.forEach((val: string) => {
      const p = parseLabel(val)
      if (p.oper === '=' && labels.includes(val)) hasEquity = true
      if (p.oper === '!=' && labels.includes(`${p.prefix}=${p.suffix}`)) hasInequity = true
    })
    return !hasInequity && hasEquity
  }
}
