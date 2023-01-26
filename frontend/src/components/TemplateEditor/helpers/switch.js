/* Copyright Contributors to the Open Cluster Management project */
'use strict'

module.exports.switchFn = function (v, opts) {
  opts.data._switch_value_ = v
  return opts.fn(this)
}
