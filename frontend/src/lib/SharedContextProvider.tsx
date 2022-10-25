/* Copyright Contributors to the Open Cluster Management project */
import { Context } from 'react'
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'

/** Extends 'console.context-provider' extension to enable sharing of a React context across plugins. */
export type SharedContextProvider<T = any> = ExtensionDeclaration<
    'console.context-provider',
    {
        /** Unique identifier for this item. */
        id: string
        /** Context reference for sharing across plugins. */
        context: CodeRef<Context<T>>
    }
>

// Type guards

export const isSharedContextProvider = (e: Extension): e is SharedContextProvider =>
    e.type === 'console.context-provider' && e.properties.id && e.properties.context
