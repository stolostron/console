'use strict'

module.exports.switchFn = (v, opts) => {
  opts.data._switch_value_ = v
  return opts.fn(this)
}
