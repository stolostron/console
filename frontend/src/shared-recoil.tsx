/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CallbackInterface, RecoilState, RecoilValue, SetterOrUpdater } from 'recoil'

import { PluginContext } from './lib/PluginContext'
import { useContext } from 'react'

export function useSharedRecoil() {
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

export function useRecoilCallback<Args extends readonly unknown[], Return>(
    param: (interfce: CallbackInterface) => (...args: Args) => Return,
    deps?: readonly unknown[] | undefined
) {
    const { useRecoilCallback: useSharedRecoilCallback } = useSharedRecoil()
    return useSharedRecoilCallback(param, deps)
}
