/* Copyright Contributors to the Open Cluster Management project */
import _ from 'lodash'

const localSubSuffixStr = '-local'
export const subAnnotationStr = 'apps.open-cluster-management.io/subscriptions'

export const isLocalSubscription = (subName, subList) => {
    return _.endsWith(subName, localSubSuffixStr) && _.indexOf(subList, _.trimEnd(subName, localSubSuffixStr)) !== -1
}

export const getSubscriptionAnnotations = (app) => {
    const subAnnotation = app.metadata?.annotations ? app.metadata?.annotations[subAnnotationStr] : undefined
    return subAnnotation ? subAnnotation.split(',') : []
}
