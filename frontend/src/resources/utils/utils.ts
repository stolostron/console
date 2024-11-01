/* Copyright Contributors to the Open Cluster Management project */

import get from 'get-value'
import { ReactNode } from 'react'

export function getLatest<T>(items: T[], key: string) {
  if (items.length === 0) {
    return undefined
  }
  if (items.length === 1) {
    return items[0]
  }

  return items.reduce((a, b) => {
    const [timeA, timeB] = [a, b].map((x: T) => new Date(get(x as unknown as object, key, '')))
    return timeA > timeB ? a : b
  })
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
  return `"${typeof exportValue === 'string' ? exportValue.split('\n').join() : exportValue}"`
}
