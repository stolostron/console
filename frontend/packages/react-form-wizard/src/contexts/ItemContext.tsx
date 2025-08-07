/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'
import get from 'get-value'

/** ItemContext is the item context that input components are editing. */
export const ItemContext = createContext<object>({})
ItemContext.displayName = 'ItemContext'

export function useItem(path?: string) {
  const item = useContext(ItemContext)
  if (path) {
    return get(item, path)
  }
  return item
}
