/* Copyright Contributors to the Open Cluster Management project */

type IfOpts = {
  fn: (ctx: unknown) => unknown
  inverse: (ctx: unknown) => unknown
}

export function if_gtFn(this: unknown, v1: unknown, v2: unknown, opts: IfOpts): unknown {
  // Template compares arbitrary handlebars values (numbers or coercible scalars)
  return (v1 as string | number) > (v2 as string | number) ? opts.fn(this) : opts.inverse(this)
}
