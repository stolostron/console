/* Copyright Contributors to the Open Cluster Management project */

/**
 * Code reference, represented by a function that returns a promise for the object `T`.
 */
 export type CodeRef<T = any> = () => Promise<T>

 /**
 * Extract type `T` from `CodeRef<T>`.
 */
export type ExtractCodeRefType<R> = R extends CodeRef<infer T> ? T : never;

/**
 * Infer resolved `CodeRef` properties from object `O` recursively.
 */
export type ResolvedCodeRefProperties<O extends {}> = {
  [K in keyof O]: O[K] extends CodeRef ? ExtractCodeRefType<O[K]> : ResolvedCodeRefProperties<O[K]>;
};

/**
 * OCP Console feature flags used to gate extension instances.
 */
export type ExtensionFlags = Partial<{
  required: string[]
  disallowed: string[]
}>

/**
 * An extension of the OCP Console application.
 *
 * Each extension instance has a `type` and the corresponding parameters
 * represented by the `properties` object.
 *
 * Each extension may specify `flags` referencing Console feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 */
export type Extension<P extends {} = any> = {
  type: string
  properties: P
  flags?: ExtensionFlags
}

/**
 * Declaration of OCP Console extension type.
 */
export type ExtensionDeclaration<T extends string, P extends {}> = Extension<P> & {
  type: T
}
