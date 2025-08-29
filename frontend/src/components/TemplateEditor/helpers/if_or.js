/* Copyright Contributors to the Open Cluster Management project */
'use strict'

export const if_orFn = (v1, v2, opts) => {
  return v1 || v2 ? opts.fn(this) : opts.inverse(this)
}
