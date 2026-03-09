/* Copyright Contributors to the Open Cluster Management project */
'use strict'

export function defaultFn(opts) {
  if (opts.data && !opts.data._cased_) {
    return opts.fn(this)
  }
}
