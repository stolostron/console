/* Copyright Contributors to the Open Cluster Management project */
'use strict'

module.exports.if_truthyFn = function (v1, opts) {
    // Values from credentials may be wrapped in an array
    v1 = Array.isArray(v1) && v1.length ? v1[0] : v1
    return v1 ? opts.fn(this) : opts.inverse(this)
}
