/* Copyright Contributors to the Open Cluster Management project */

type IfOpts = {
  fn: (ctx: unknown) => unknown
  inverse: (ctx: unknown) => unknown
}

export function if_truthyFn(this: unknown, v1: unknown, opts: IfOpts): unknown {
  // Values from credentials may be wrapped in an array
  const v = Array.isArray(v1) && v1.length ? v1[0] : v1
  return v ? opts.fn(this) : opts.inverse(this)
}
