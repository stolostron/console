'use strict'

module.exports.defaultFn = function (opts) {
    if (opts.data && !opts.data._cased_) {
        return opts.fn(this)
    }
}
