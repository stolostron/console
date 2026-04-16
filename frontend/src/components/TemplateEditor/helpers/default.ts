/* Copyright Contributors to the Open Cluster Management project */

type DefaultOpts = {
  data?: { _cased_?: boolean }
  fn: (ctx: unknown) => string
}

export function defaultFn(this: unknown, opts: DefaultOpts): string | undefined {
  if (opts.data && !opts.data._cased_) {
    return opts.fn(this)
  }
}
