/* Copyright Contributors to the Open Cluster Management project */
'use strict'

export const defaultFn = function (opts) {
  if (opts.data && !opts.data._cased_) {
    return opts.fn(this)
  }
}
