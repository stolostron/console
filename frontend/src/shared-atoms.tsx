/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useAtomValue, useSetAtom } from 'jotai'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { Atom, WritableAtom } from 'jotai'
import { useCallback, useContext } from 'react'

import { PluginContext } from './lib/PluginContext'

export type SharedValue<Value> = Atom<Value>

/* Do not export - wrapper functions should be used to track atom usage */
function useSharedStore() {
  const { dataContext } = useContext(PluginContext)
  const { store } = useContext(dataContext)

  return store
}

export function useSharedAtoms() {
  const { dataContext } = useContext(PluginContext)
  const { atoms } = useContext(dataContext)

  return atoms
}

export function useSharedSelectors() {
  const { dataContext } = useContext(PluginContext)
  const { selectors } = useContext(dataContext)

  return selectors
}

export function useSharedValue<Value>(target: SharedValue<Value>): Value {
  const store = useSharedStore()
  return useAtomValue(target, { store })
}

export function useSetSharedValue<Value, Args extends unknown[], Result>(target: WritableAtom<Value, Args, Result>) {
  const store = useSharedStore()
  return useSetAtom(target, { store })
}

export function useSharedValueGetter<Value>(target: SharedValue<Value>): () => Value {
  const store = useSharedStore()
  return useCallback(() => store.get(target), [store, target])
}
