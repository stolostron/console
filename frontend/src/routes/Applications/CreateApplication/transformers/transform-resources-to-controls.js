/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.

 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getResourceID, getSourcePath } from 'temptifly'
import { getUniqueChannelName } from '../ControlData/utils'
import _ from 'lodash'

export const getRepoTypeForArgoApplication = source => {
  if (source && source.path) {
    return 'github'
  } else if (source && source.chart) {
    return 'helmrepo'
  }
  return ''
}

//only called when editing an existing application
//examines resources to create the correct resource types that are being deployed
export const discoverGroupsFromSource = (
  control,
  cd,
  templateObject,
  editor
) => {
  const applicationResource = _.get(
    templateObject,
    'ApplicationSet[0].$raw',
    {}
  )

  discoverChannelFromSource(control, cd, templateObject)

  // get application selflink
  const selfLinkControl = cd.find(({ id }) => id === 'selfLink')
  const selfLink = getResourceID(applicationResource)
  if (selfLinkControl) {
    selfLinkControl['active'] = selfLink
  }

  //argoServer
  const argoServer = cd.find(({ id }) => id === 'argoServer')
  const ns = _.get(applicationResource, 'metadata.namespace')
  _.set(argoServer, 'active', ns)

  // requeue time
  const requeueTime = cd.find(({ id }) => id === 'requeueTime')
  _.set(
    requeueTime,
    'active',
    _.get(
      applicationResource,
      'spec.generators[0].clusterDecisionResource.requeueAfterSeconds'
    )
  )
  // Template
  // add a channel for every group
  templateObject = _.cloneDeep(templateObject)
  const source = _.get(applicationResource, 'spec.template.spec.source')
  const chart = _.get(source, 'chart')
  const id = chart ? 'helmrepo' : 'github'

  // insert channel type control data in this group
  const channelTypeControl = control.active[0][3]
  channelTypeControl.active = id
  const availableMap = _.get(channelTypeControl.availableMap, id)
  const insertControlData = _.get(availableMap, 'change.insertControlData')
  control.active[0] = [...control.active[0], ...insertControlData]

  const handler = {
    get: (obj, prop) => {
      const target = editor.currentData()
      let ret = Reflect.get(target, prop)
      if (typeof ret === 'function') {
        ret = ret.bind(target)
      }
      return ret
    }
  }
  const lastestData = new Proxy({}, handler)
  control.active[0].forEach(c => {
    c.groupControlData = control.active[0]
    if (typeof c.onSelect === 'function') {
      c.onSelect = c.onSelect.bind(null, c, lastestData, (ctrl, isLoading) => {
        if (isLoading) {
          ctrl.isLoading = isLoading
          editor.forceUpdate()
        } else {
          setTimeout(() => {
            ctrl.isLoading = isLoading
            editor.forceUpdate()
          })
        }
      })
    }
  })
  if (insertControlData) {
    const { repoURL, path, targetRevision } = source
    const githubURL = insertControlData.find(({ id }) => id === 'githubURL')
    const githubPath = insertControlData.find(({ id }) => id === 'githubPath')
    const githubBranch = insertControlData.find(
      ({ id }) => id === 'githubBranch'
    )
    _.set(githubURL, 'active', repoURL)
    _.set(githubPath, 'active', path)
    _.set(githubBranch, 'active', targetRevision)
  }

  // Placement
  const clusterSelectorControl = cd.find(({ id }) => id === 'clusterSelector')
  const existingRuleControl = cd.find(
    ({ id }) => id === 'existingrule-checkbox'
  )
  _.set(existingRuleControl, 'active', true)

  const decisionResourceControl = cd.find(
    ({ id }) => id === 'decisionResourceName'
  )
  _.set(decisionResourceControl, 'type', 'combobox')
  const sourcePath =
    'ApplicationSet[0].spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]'
  const decision = _.get(templateObject, getSourcePath(sourcePath), {})
  _.set(decisionResourceControl, 'active', decision.$v)
  _.set(clusterSelectorControl, 'type', 'hidden')

  // sync policy
  const syncOptions = _.get(
    applicationResource,
    'spec.template.spec.syncPolicy.syncOptions',
    []
  )
  const automated = _.get(
    applicationResource,
    'spec.template.spec.syncPolicy.automated',
    []
  )
  _.forEach(automated, (key, value) => {
    switch (value) {
    case 'allowEmpty':
      control = cd.find(({ id }) => id === 'allowEmpty')
      control.active = true
      break
    case 'prune':
      control = cd.find(({ id }) => id === 'prune')
      control.active = true
      break
    case 'selfHeal':
      control = cd.find(({ id }) => id === 'selfHeal')
      control.active = true
      break
    }
  })

  _.forEach(syncOptions, option => {
    switch (option) {
    case 'ApplyOutOfSyncOnly=true':
      control = cd.find(({ id }) => id === 'applyOutOfSyncOnly')
      control.active = true
      break
    case 'CreateNamespace=true':
      control = cd.find(({ id }) => id === 'createNamespace')
      control.active = true
      break
    case 'Replace=true':
      control = cd.find(({ id }) => id === 'replace')
      control.active = true
      break
    case 'Validate=true':
      control = cd.find(({ id }) => id === 'validate')
      control.active = true
      break
    case (option.match(/^PrunePropagationPolicy/) || {}).input: {
      control = cd.find(({ id }) => id === 'prunePropagationPolicy')
      control.active = true
      const propagationPolicy = cd.find(
        ({ id }) => id === 'propagationPolicy'
      )
      const propagationPolicySelection = option.slice(
        option.lastIndexOf('=') + 1
      )
      _.set(propagationPolicy, 'type', 'singleselect')
      _.set(propagationPolicy, 'active', propagationPolicySelection)
      break
    }
    }
  })
}

const discoverChannelFromSource = (control, cd, templateObject) => {
  // determine channel name
  const source = _.get(
    templateObject,
    'ApplicationSet[0].$raw.spec.template.spec.source'
  )
  const id = getRepoTypeForArgoApplication(source)

  const { repoURL } = source
  const channelName = getUniqueChannelName(repoURL, cd)
  const channelNamespace = `${channelName}-ns`
  const channelType = _.get(control, 'controlData', {}).find(
    ({ id: _id }) => _id === 'channelType'
  )
  const resource = _.get(channelType, 'available', []).find(
    ({ id: _id }) => _id === id
  )

  if (resource) {
    const insertControlData = _.get(resource, 'change.insertControlData', [])
    const channelNamespaceControl = insertControlData.find(
      ({ id: _id }) => _id === 'channelNamespace'
    )
    const channelNameControl = insertControlData.find(
      ({ id: _id }) => _id === 'channelName'
    )

    _.set(channelNameControl, 'active', channelName)
    _.set(channelNamespaceControl, 'active', channelNamespace)
  }
}
