/* Copyright Contributors to the Open Cluster Management project */

type CaseOpts = {
  data: { _switch_value_?: unknown; _cased_?: boolean }
  fn: (ctx: unknown) => string
}

export function caseFn(this: unknown, v: unknown, opts: CaseOpts): string | undefined {
  if (v == opts.data._switch_value_) {
    opts.data._cased_ = true
    return opts.fn(this)
  }
}
