/* Copyright Contributors to the Open Cluster Management project */

type SwitchOpts = {
  data: { _switch_value_?: unknown }
  fn: (ctx: unknown) => string
}

export function switchFn(this: unknown, v: unknown, opts: SwitchOpts): string {
  opts.data._switch_value_ = v
  return opts.fn(this)
}
