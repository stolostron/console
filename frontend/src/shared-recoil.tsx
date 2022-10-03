/* Copyright Contributors to the Open Cluster Management project */
import { PluginContext } from './lib/PluginContext'
import { useContext } from 'react'
import {
    AtomOptions,
    ReadOnlySelectorOptions,
    RecoilState,
    RecoilValue,
    RecoilValueReadOnly,
    SetterOrUpdater,
} from 'recoil'

// const {useRecoilValue} = PluginContext.

export function useSharedAtoms() {
    const { dataContext } = useContext(PluginContext)
    const { atoms } = useContext(dataContext)

    return atoms
}

function useSharedRecoil() {
    const { dataContext } = useContext(PluginContext)
    const { recoil } = useContext(dataContext)

    return recoil
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

export function atom<T>(param: AtomOptions<T>): RecoilState<T> {
    const { atom: sharedAtom } = useSharedRecoil()
    return sharedAtom(param)
}

export function readOnlySelector<T>(param: ReadOnlySelectorOptions<T>): RecoilValueReadOnly<T> {
    const { selector: sharedSelector } = useSharedRecoil()
    return sharedSelector(param)
}

// function selector<T>(options: ReadWriteSelectorOptions<T>): RecoilState<T> (+1 overload)

// export function selector<T>(options: ReadWriteSelectorOptions<T>): RecoilState<T>;
// export function selector<T>(options: ReadOnlySelectorOptions<T>): RecoilValueReadOnly<T>;
// export namespace selector {
//  function value<T>(value: T): WrappedValue<T>;
// }
