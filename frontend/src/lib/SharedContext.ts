/* Copyright Contributors to the Open Cluster Management project */
import { Context } from 'react'
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'

/** Enables sharing of a React context across plugins. */
export type SharedContext<T = any> = ExtensionDeclaration<
  'acm.shared-context',
  {
    /** Unique identifier for this item. */
    id: string
    /** Context reference for sharing across plugins. */
    context: CodeRef<Context<T>>
  }
>

// Type guards

export const isSharedContext = (e: Extension): e is SharedContext =>
  e.type === 'acm.shared-context' && e.properties.id && e.properties.context
