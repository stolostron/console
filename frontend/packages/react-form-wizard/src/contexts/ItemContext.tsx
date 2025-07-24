/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'

/** ItemContext is the item context that input components are editing. */
export const ItemContext = createContext<object>({})
ItemContext.displayName = 'ItemContext'

export function useItem() {
  return useContext(ItemContext)
}
