'use strict'

module.exports.caseFn = function (v, opts) {
    if (v == opts.data._switch_value_) {
        opts.data._cased_ = true
        return opts.fn(this)
    }
}
