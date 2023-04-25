/* Copyright Contributors to the Open Cluster Management project */

export const FilterResults = Object.freeze({
  nosearch: '', // no search in progress
  match: 'match', // match
  hidden: 'hidden', // doesn't match
  related: 'related', //related to match
  matched: 'matched', // a previous match--used when out of search mode
})

export const statusToIconMap = Object.freeze({
  success: {
    icon: 'success',
    classType: 'success',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  error: {
    icon: 'failure',
    classType: 'failure',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  running: {
    icon: 'running',
    classType: 'success',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  pending: {
    icon: 'pending',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  blocked: {
    icon: 'blocked',
    classType: 'success',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  spinner: {
    icon: 'spinner',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
  warning: {
    icon: 'warning',
    classType: 'warning',
    width: 16,
    height: 16,
    dx: -18,
    dy: 12,
  },
})
