/* Copyright Contributors to the Open Cluster Management project */
'use strict'

// True when an additional label key is already emitted by a set dedicated location field.
// Used to skip the additional label so the rendered YAML has no duplicate keys.
module.exports.isOverriddenByLocationFieldFn = function (key, opts) {
  const root = opts.data.root
  return (key === 'zone' && !!root.zone) || (key === 'datacenter' && !!root.locationDatacenter)
}
