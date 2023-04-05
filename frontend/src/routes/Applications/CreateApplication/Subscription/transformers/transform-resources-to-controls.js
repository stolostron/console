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

import YAML from 'yaml'
import { initializeControls, getSourcePath, getResourceID } from '../../../../../components/TemplateEditor'
import { filterDeep } from './transform-data-to-resources'
import _ from 'lodash'
import { PlacementRuleKind } from '../../../../../resources'

//only called when editing an existing application
//examines resources to create the correct resource types that are being deployed
export const discoverGroupsFromSource = (control, cd, templateObject, editor, i18n) => {
  const applicationResource = _.get(templateObject, 'Application[0].$raw')
  // get application selflink
  const selfLinkControl = cd.find(({ id }) => id === 'selfLink')
  const selfLink = getResourceID(applicationResource)
  selfLinkControl['active'] = selfLink

  // find groups
  const {
    controlData: groupData,
    prompts: { nameId, baseName },
  } = control
  templateObject = _.cloneDeep(templateObject)
  control.nextUniqueGroupID = 1
  const times = _.get(templateObject, 'Subscription.length')
  if (times) {
    const active = []
    let uniqueGroupID = times + 1
    _.times(times, () => {
      // add a group for every subscription
      uniqueGroupID = uniqueGroupID + 1
      const newGroup = initializeControls(groupData, editor, null, i18n, uniqueGroupID, true)
      active.push(newGroup)
      const nameControl = _.keyBy(newGroup, 'id')[nameId]
      nameControl.active = `${baseName}-${active.length - 1}`

      // add a channel for every group
      const cardsControl = newGroup.find(({ id }) => id === 'channelType')
      const subscriptionDigit = discoverChannelFromSource(
        cardsControl,
        newGroup,
        cd,
        templateObject,
        editor,
        times > 1,
        i18n
      )
      if (subscriptionDigit >= control.nextUniqueGroupID) {
        control.nextUniqueGroupID = subscriptionDigit + 1
      }

      const selfLinksControl = newGroup.find(({ id }) => id === 'selfLinks')
      if (selfLinksControl) {
        _.set(selfLinksControl, 'active.Application', selfLink)
      }
      shiftTemplateObject(templateObject, selfLinksControl)
    })
    control.active = active
  }
}

const discoverChannelFromSource = (
  cardsControl,
  groupControlData,
  globalControl,
  templateObject,
  editor,
  multiple,
  i18n
) => {
  // determine channel type
  let id

  // try channel type first
  switch (_.get(templateObject, 'Channel[0].$raw.spec.type')) {
    case 'git':
    case 'github':
    case 'Git':
    case 'GitHub':
      id = 'github'
      break
    case 'HelmRepo':
      id = 'helmrepo'
      break
    case 'ObjectBucket':
      id = 'objectstore'
      break
    case 'Namespace':
      id = 'other'
      break
  }

  // if that didn't work, try the subscription
  if (!id) {
    const subscription = _.get(templateObject, 'Subscription[0].$raw')
    switch (true) {
      // if it has a package filter assume helm
      case !!_.get(subscription, 'spec.packageFilter.version'):
        id = 'helmrepo'
        break

      default:
        id = 'other'
        break
    }
  }
  cardsControl.active = id

  // if editing an existing app that doesn't have a standard channel type
  // show the other channel type
  if (id === 'other') {
    delete cardsControl.availableMap[id].hidden
  }

  // insert channel type control data in this group
  const insertControlData = _.get(cardsControl.availableMap[id], 'change.insertControlData')
  if (insertControlData) {
    const insertInx = groupControlData.findIndex(({ id: _id }) => _id === cardsControl.id)
    // splice control data with data from this card
    groupControlData.splice(insertInx + 1, 0, ..._.cloneDeep(insertControlData))
    groupControlData.forEach((cd) => {
      cd.groupControlData = groupControlData
    })
    initializeControls(groupControlData, editor, null, i18n)

    // initialize channel namespace
    const path = 'Subscription[0].spec.channel'
    const channel = _.get(templateObject, getSourcePath(path))
    if (channel) {
      const [ns] = channel.$v.split('/')
      if (ns) {
        const channelNamespace = groupControlData.find(({ id: _id }) => _id === 'channelNamespace')
        channelNamespace.active = ns
      }
    }

    // remember if this is a deprecated PlacementRuleKind
    const placementKind = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.kind'))?.$v
    const isDeprecatedPRControl = groupControlData.find(({ id }) => id === 'isDeprecatedPR')
    const deprecatedRuleControl = groupControlData.find(({ id }) => id === 'deprecated-rule')
    if (isDeprecatedPRControl && deprecatedRuleControl && placementKind === PlacementRuleKind) {
      isDeprecatedPRControl.active = true
      const ruleName = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.name'))?.$v
      const rule = templateObject[PlacementRuleKind].find((rule) => ruleName === rule?.$raw?.metadata?.name)
      deprecatedRuleControl.active = YAML.stringify(filterDeep(rule.$raw))
    }

    // if more then one group, collapse all groups
    groupControlData
      .filter(({ type }) => type === 'section')
      .forEach((section) => {
        section.collapsed = true
      })
  }

  // get trailing digit so we can create a unique name
  let subscriptionDigit
  const subscriptionName = _.get(templateObject, getSourcePath('Subscription[0].metadata.name') + '.$v')
  if (subscriptionName) {
    const match = subscriptionName.match(/-(\d+)$/)
    if (match && match[1]) {
      subscriptionDigit = parseInt(match[1], 10)
    }
  }
  return subscriptionDigit
}

//called for each group when editor refreshes control active values from the template
//reverse source path always points to first template resource (ex: Subscription[0])
//so after one group has been processed, pop the top Subscription so that next pass
//the Subscription[0] points to the next group
export const shiftTemplateObject = (templateObject, selfLinksControl) => {
  // pop the subscription off of all subscriptions
  let subscription = _.get(templateObject, 'Subscription')
  if (subscription) {
    subscription = subscription.shift()
    if (selfLinksControl) {
      const subscriptionSelfLink = getResourceID(subscription.$raw)
      _.set(selfLinksControl, 'active.Subscription', subscriptionSelfLink)
    }

    // if this subscription pointed to a channel in this template
    // remove that channel too
    let name = _.get(subscription, '$synced.spec.$v.channel.$v')
    if (name) {
      const [ns, n] = name.split('/')
      const channels = templateObject.Channel || []
      const inx = channels.findIndex((rule) => {
        return (
          n === _.get(rule, '$synced.metadata.$v.name.$v') && ns === _.get(rule, '$synced.metadata.$v.namespace.$v')
        )
      })
      if (inx !== -1) {
        const channel = templateObject.Channel.splice(inx, 1)[0]
        if (selfLinksControl) {
          const channelSelfLink = getResourceID(channel.$raw)
          _.set(selfLinksControl, 'active.Channel', channelSelfLink)
        }
      }
    }
  }
}
