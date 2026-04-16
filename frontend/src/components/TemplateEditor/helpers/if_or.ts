/* Copyright Contributors to the Open Cluster Management project */

type IfOpts = {
  fn: (ctx: unknown) => unknown
  inverse: (ctx: unknown) => unknown
}

export function if_orFn(this: unknown, v1: unknown, v2: unknown, opts: IfOpts): unknown {
  return v1 || v2 ? opts.fn(this) : opts.inverse(this)
}
