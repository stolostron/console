/* Copyright Contributors to the Open Cluster Management project */
'use strict'

export const caseFn = function (v, opts) {
  if (v == opts.data._switch_value_) {
    opts.data._cased_ = true
    return opts.fn(this)
  }
}
