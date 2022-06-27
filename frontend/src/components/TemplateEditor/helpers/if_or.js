'use strict'

module.exports.if_orFn = function (v1, v2, opts) {
    return v1 || v2 ? opts.fn(this) : opts.inverse(this)
}
