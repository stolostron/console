/* Copyright Contributors to the Open Cluster Management project */
import _ from 'lodash'

const localSubSuffixStr = '-local'

export const isLocalSubscription = (subName, subList) => {
  return _.endsWith(subName, localSubSuffixStr) &&
  _.indexOf(subList, _.trimEnd(subName, localSubSuffixStr)) !== -1
}