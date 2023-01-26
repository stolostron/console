/* Copyright Contributors to the Open Cluster Management project */
'use strict'

module.exports.if_neFn = function (v1, v2, opts) {
  return v1 !== v2 ? opts.fn(this) : opts.inverse(this)
}
