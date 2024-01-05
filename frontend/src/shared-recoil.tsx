/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CallbackInterface, RecoilState, RecoilValue, SetterOrUpdater } from 'recoil'

import { PluginContext } from './lib/PluginContext'
import { useContext } from 'react'

/* Do not export - wrapper functions should be used to track atom usage */
function useSharedRecoil() {
  const { dataContext } = useContext(PluginContext)
  const { recoil } = useContext(dataContext)

  return recoil
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

export function useRecoilValue<T>(param: RecoilValue<T>): T {
  const { useRecoilValue: useSharedRecoilValue } = useSharedRecoil()
  return useSharedRecoilValue(param)
}

export function useSetRecoilState<T>(param: RecoilState<T>): SetterOrUpdater<T> {
  const { useSetRecoilState: useSharedSetRecoilState } = useSharedRecoil()
  return useSharedSetRecoilState(param)
}

export function useRecoilState<T>(param: RecoilState<T>): [T, SetterOrUpdater<T>] {
  const { useRecoilState: useSharedRecoilState } = useSharedRecoil()
  return useSharedRecoilState(param)
}

export function useRecoilValueGetter<T>(param: RecoilValue<T>): () => T {
  const { useRecoilCallback: useSharedRecoilCallback } = useSharedRecoil()
  return useSharedRecoilCallback<[], T>(
    ({ snapshot }) =>
      () =>
        snapshot.getLoadable(param).contents,
    []
  )
}
