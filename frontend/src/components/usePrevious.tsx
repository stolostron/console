/* Copyright Contributors to the Open Cluster Management project */

import { useRef, useEffect } from 'react'

export function usePrevious<T>(value: T): T {
    const ref = useRef<T>()
    useEffect(() => {
        ref.current = value
    }, [value])
    return ref.current as T
}
