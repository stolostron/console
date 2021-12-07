/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

module.exports.ACM_ACCESS_COOKIE = 'acm-access-token-cookie'
module.exports.ACM_AUTH_COOKIE = 'acm-acs-auth-cookie'
module.exports.ACM_USER_COOKIE = 'acm-user-cookie'
module.exports.ACM_REFRESH_INTERVAL_COOKIE = 'acm-refresh-interval-cookie'

module.exports.MCM_DIAGRAM_FILTER_COOKIE = 'mcm-diagram-filter-cookie'
module.exports.MCM_DESIGN_SPLITTER_OPEN_COOKIE =
  'mcm-design-splitter-open-cookie'
module.exports.MCM_DESIGN_SPLITTER_SIZE_COOKIE =
  'mcm-design-splitter-size-cookie'
module.exports.OVERVIEW_REFRESH_INTERVAL_COOKIE =
  'mcm-overview-interval-refresh-cookie'
module.exports.DIAGRAM_REFRESH_INTERVAL_COOKIE =
  'mcm-diagram-interval-refresh-cookie'
module.exports.REFRESH_TIMES = [15, 30, 60, 5 * 60, 30 * 60, 0]
module.exports.DEFAULT_REFRESH_TIME = 15000
module.exports.INITIAL_REFRESH_TIME = 15

module.exports.OVERVIEW_QUERY_COOKIE = 'mcm-overview-query-cookie'
module.exports.OVERVIEW_STATE_COOKIE = 'mcm-overview-state-cookie'
module.exports.DIAGRAM_QUERY_COOKIE = 'mcm-diagram-query-cookie'

module.exports.MAX_CHART_DATA_SIZE = 30

module.exports.LOCAL_HUB_NAME = 'local-cluster'

module.exports.API_VERSION = 'apps.open-cluster-management.io/v1'

module.exports.RESOURCE_TYPES = {
  QUERY_APPLICATIONS: {
    name: 'QueryApplications',
    list: 'QueryApplicationList',
    fallback: 'getApplications',
    kind: 'Application',
    dataKey: 'applications',
    apiVersion: 'app.k8s.io/v1beta1'
  },
  QUERY_APPLICATIONSET: {
    name: 'QueryApplicationset',
    list: 'QueryApplicationsetList',
    fallback: 'getApplicationset',
    kind: 'ApplicationSet',
    dataKey: 'applicationset',
    apiVersion: 'argoproj.io/v1alpha1'
  },
  QUERY_SUBSCRIPTIONS: {
    name: 'QuerySubscriptions',
    list: 'QuerySubscriptionList',
    fallback: 'HCMSubscriptionList',
    kind: 'Subscription',
    dataKey: 'subscriptions',
    apiVersion: module.exports.API_VERSION
  },
  QUERY_PLACEMENTRULES: {
    name: 'QueryPlacementRules',
    list: 'QueryPlacementRuleList',
    fallback: 'HCMPlacementRuleList',
    kind: 'PlacementRule',
    dataKey: 'placementRules',
    apiVersion: module.exports.API_VERSION
  },
  QUERY_CHANNELS: {
    name: 'QueryChannels',
    list: 'QueryChannelList',
    fallback: 'HCMChannelList',
    kind: 'Channel',
    dataKey: 'channels',
    apiVersion: module.exports.API_VERSION
  },
  HCM_APPLICATIONS: { name: 'HCMApplication', list: 'HCMApplicationList' },
  HCM_CHANNELS: { name: 'HCMChannel', list: 'HCMChannelList' },
  HCM_SUBSCRIPTIONS: { name: 'HCMSubscription', list: 'HCMSubscriptionList' },
  HCM_PLACEMENT_RULES: {
    name: 'HCMPlacementRule',
    list: 'HCMPlacementRuleList'
  },
  HCM_FILTER_LIST: { name: 'HCMFilterList', list: 'HCMFilterList' },
  HCM_TOPOLOGY: { name: 'HCMTopology', list: 'HCMTopology' },
  USER_INFO: { name: 'userInfo', list: 'userInfoList' }
}

module.exports.MCM_CLUSTERS_SERVICES_ACTIONS = {}

module.exports.DOC_PATH_BASE =
  'https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/2.4/html/applications/managing-applications'

module.exports.DOC_LINKS = {
  HOME: `${module.exports.DOC_PATH_BASE}`
}
