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

// seems to be an issue with this rule and redux

import YAML from 'yaml'
import TimeWindow, { reverse as reverseTimeWindow, summarize as summarizeTimeWindow } from '../common/TimeWindow'
import PlacementRuleDeprecationAlert from '../../../../../components/PlacementRuleDeprecationAlert'
import ClusterSelector, { summarize as summarizeClusterSelector } from '../common/ClusterSelector'
import { getSharedPlacementRuleWarning, getSharedSubscriptionWarning } from './utils'
import { getSourcePath } from '../../../../../components/TemplateEditor'
import { listPlacementRules, listPlacements, PlacementRuleKind } from '../../../../../resources'
import { getControlByID } from '../../../../../lib/temptifly-utils'
import { filterDeep } from '../transformers/transform-data-to-resources'
import _ from 'lodash'

const clusterSelectorCheckbox = 'clusterSelector'
const existingRuleCheckbox = 'existingrule-checkbox'
const unavailable = '-unavailable-'
const nameIndex = 'metadata.name'

export const loadExistingPlacementRules = (t) => {
  let nsControl = undefined

  return {
    query: () => {
      return Promise.all([listPlacementRules(nsControl.active).promise, listPlacements(nsControl.active).promise])
    },
    variables: (control, globalControl) => {
      nsControl = globalControl.find(({ id: idCtrl }) => idCtrl === 'namespace')
    },
    loadingDesc: t('creation.app.loading.rules'),
    setAvailable: setAvailableRules.bind(null),
  }
}

const getLabels = (clusterSelector) => {
  return clusterSelector?.matchExpressions
    ?.map(({ key, operator, values }) => {
      return `${key} "${operator}" ${values.join(', ')}`
    })
    .join('; ')
}

const setAvailableRules = (control, result) => {
  const { loading } = result
  const { data, i18n } = result
  const placementRules = data && data[0]
  const placements = data && data[1]
  control.isLoading = false
  const error = placementRules ? null : result.error
  if (!control.available) {
    control.available = []
    control.availableData = []
  }
  if (error || placementRules) {
    if (error) {
      control.isFailed = true
      control.isLoaded = true
    } else if (placementRules) {
      control.isLoaded = true

      control.availableInfo = {}
      const { groupControlData } = control
      const enableHubSelfManagement = getControlByID(groupControlData, 'enableHubSelfManagement')

      const placementKeyFn = (placement) => {
        let selector = unavailable
        const placementName = _.get(placement, nameIndex, '')
        const clusterSelector = _.get(placement, 'spec.predicates[0].requiredClusterSelector.labelSelector')
        if (clusterSelector) {
          selector = i18n('creation.app.clusters.expressions', [
            placement.kind,
            placementName,
            getLabels(clusterSelector),
          ])
        }
        control.availableInfo[placementName] = selector
        return placementName
      }

      const keyFn = (rule) => {
        const ruleName = _.get(rule, nameIndex, '')
        const clusterSelector = _.get(rule, 'spec.clusterSelector')
        const clusterConditions = _.get(rule, 'spec.clusterConditions')
        let selector = enableHubSelfManagement?.active
          ? i18n('creation.app.local.clusters.only', [rule.kind, ruleName])
          : unavailable
        if (clusterSelector?.matchExpressions?.length > 0) {
          if (clusterSelector.matchExpressions[0]?.key !== 'local-cluster') {
            selector = i18n('creation.app.clusters.expressions', [rule.kind, ruleName, getLabels(clusterSelector)])
          }
        } else if (clusterConditions && clusterConditions[0]?.type === 'ManagedClusterConditionAvailable') {
          selector = enableHubSelfManagement?.active
            ? i18n('creation.app.clusters.all.online', [rule.kind, ruleName])
            : i18n('creation.app.clusters.only.online', [rule.kind, ruleName])
        } else if (clusterSelector.matchLabels) {
          if (!clusterSelector.matchLabels['local-cluster']) {
            const getMatchLabels = () => {
              return Object.entries(clusterSelector.matchLabels)
                .map(([key, value]) => {
                  return `${key}=${value}`
                })
                .join('; ')
            }
            selector = i18n('creation.app.clusters.matching', [rule.kind, ruleName, getMatchLabels()])
          }
        }
        control.availableInfo[ruleName] = selector
        return ruleName
      }

      let placementRulesAvailableData = {}
      let placementRulesAvailable = []
      let placementsAvailableData = {}
      let placementsAvailable = []

      if (placementRules.length) {
        placementRulesAvailableData = _.keyBy(placementRules, keyFn)
        placementRulesAvailable = _.map(Object.values(placementRulesAvailableData), keyFn)
          .filter((ruleName) => control.availableInfo[ruleName] !== unavailable)
          .sort()
      }
      if (placements.length) {
        placementsAvailableData = _.keyBy(placements, placementKeyFn)
        placementsAvailable = _.map(Object.values(placementsAvailableData), placementKeyFn)
          .filter((placementName) => control.availableInfo[placementName] !== unavailable)
          .sort()
      }
      control.availableData = { ...placementsAvailableData, ...placementRulesAvailableData }
      control.available = [...placementsAvailable, ...placementRulesAvailable]
      control.info = ''

      // if no existing placement rules & placements
      const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)
      existingRuleControl.disabled = control.available.length === 0
      if (control.available.length === 0) {
        control.placeholder = i18n('creation.app.select.no.existing.placement.rule')
        const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
        clusterSelectorControl.onSelect()
      } else {
        control.placeholder = i18n('creation.app.settings.existingRule')
        existingRuleControl.onSelect()
      }

      //remove default placement rule name if this is not on the list of available placements
      //in that case the name was set by the reverse function on control initialization
      if (control.active) {
        if (!control.available.includes(control.active)) {
          control.active = null
        } else {
          control.info = control.availableInfo[control.active]
        }
      }
    }
  } else {
    control.isLoading = loading
  }
  return control
}

export const updatePlacementControls = (control) => {
  const { id, groupControlData } = control

  // get radio controls

  const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
  const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)

  // set radio buttons based on what was selected
  clusterSelectorControl && _.set(clusterSelectorControl, 'active.mode', id === clusterSelectorCheckbox)
  existingRuleControl && _.set(existingRuleControl, 'active', id === existingRuleCheckbox)

  // opaque the existing rules combobox
  const selectedRuleComboControl = groupControlData.find(({ id }) => id === 'placementrulecombo')
  _.set(selectedRuleComboControl, 'opaque', id !== existingRuleCheckbox) // && !existingRuleControl.disabled)
  if (id !== existingRuleCheckbox) {
    selectedRuleComboControl.active = ''
    selectedRuleComboControl.info = ''
    const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
    selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', '')
  }

  return groupControlData
}

// existing placement rule combo box changed -- update hidden value used in temptlate
export const updateNewRuleControls = (control) => {
  const { availableData, availableInfo, groupControlData } = control
  const active = availableData[control.active]
  const kind = _.get(active, 'kind')
  control.info = availableInfo ? availableInfo[control?.active] : ''
  const selectedRuleNameControl = groupControlData.find(({ id }) => id === 'selectedRuleName')
  const isDeprecatedPR = groupControlData.find(({ id }) => id === 'isDeprecatedPR')
  const deprecatedRule = groupControlData.find(({ id }) => id === 'deprecated-rule')
  if (kind) {
    if (kind === PlacementRuleKind) {
      isDeprecatedPR && _.set(isDeprecatedPR, 'active', true)
      deprecatedRule && _.set(deprecatedRule, 'active', YAML.stringify(filterDeep(active)))
    } else {
      isDeprecatedPR && _.set(isDeprecatedPR, 'active', false)
      deprecatedRule && _.set(deprecatedRule, 'active', '')
    }
  }

  selectedRuleNameControl && _.set(selectedRuleNameControl, 'active', _.get(active, nameIndex))
}

/////////////////////////////////////////////////////////////////////////////
/////////////// when editing, reverse yaml source into these controls /////////////////
/////////////////////////////////////////////////////////////////////////////

//when loading an existing app, pass to the control the placement value that is currently stored by the app
//the reverse() function retrieves this the value out of the existing app template
//the editor needs the existing value to know whether or not the user changed that value
export const reverseExistingRule = (control, templateObject) => {
  const { groupControlData } = control
  const existingRuleControl = groupControlData.find(({ id }) => id === existingRuleCheckbox)
  const active = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.name'))
  if (existingRuleControl.active && active && control.active === undefined) {
    control.active = active.$v
  }
  return control
}

export const reverseOnline = (control, templateObject) => {
  const active = _.get(templateObject, getSourcePath('PlacementRule[0].spec.clusterConditions[0].type'))
  if (active) {
    control.active = !_.isEmpty(active)
  }
}

export const summarizeOnline = (control, _globalControlData, summary) => {
  const clusterSelectorControl = getControlByID(control.groupControlData, clusterSelectorCheckbox)
  const existingRuleControl = getControlByID(control.groupControlData, existingRuleCheckbox)
  const existingRuleCombo = getControlByID(control.groupControlData, 'placementrulecombo')

  if (_.get(existingRuleControl, 'active', false) === true) {
    summary.push(existingRuleCombo.info)
  } else if (_.get(clusterSelectorControl, 'active.mode', false) === true) {
    summarizeClusterSelector(control, [], summary)
  }
}

export const summarizeSelectorControl = (control, globalControlData, summary) => {
  const clusterSelectorControl = getControlByID(control.groupControlData, clusterSelectorCheckbox)

  if (_.get(clusterSelectorControl, 'active.mode', false) === true) {
    summarizeClusterSelector(control, [], summary)
  }
}

const placementData = (isLocalCluster, t) => {
  return [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  clusters  /////////////////////////////////////
    {
      id: 'clusterSection',
      type: 'section',
      title: t('creation.app.placement.rule'),
      subgroup: true,
      collapsable: true,
      collapsed: false,
      info: getSharedPlacementRuleWarning,
      editing: { editMode: true },
    },
    {
      id: 'deprecationWarning',
      type: 'custom',
      component: <PlacementRuleDeprecationAlert />,
    },
    {
      id: existingRuleCheckbox,
      type: 'radio',
      name: t('creation.app.settings.existingRule'),
      tooltip: t('tooltip.creation.app.settings.existingRule'),
      onSelect: updatePlacementControls,
      active: true,
      summarize: summarizeOnline,
    },
    {
      id: 'isDeprecatedPR',
      type: 'hidden',
      active: '',
    },
    {
      id: 'deprecated-rule',
      type: 'hidden',
      active: '',
    },
    {
      id: 'placementrulecombo',
      type: 'combobox',
      opaque: false,
      placeholder: t('creation.app.settings.existingRule'),
      reverse: reverseExistingRule,
      fetchAvailable: loadExistingPlacementRules(t),
      onSelect: updateNewRuleControls,
      validation: {},
      summarize: () => {},
    },
    {
      id: 'selectedRuleName',
      type: 'hidden',
      reverse: reverseExistingRule,
    },
    {
      id: 'enableHubSelfManagement',
      type: 'hidden',
      active: isLocalCluster,
    },
    {
      id: 'placementRuleDeprecated',
      type: 'hidden',
      deprecated: { path: 'PlacementRule[*].kind' },
    },
    {
      type: 'custom',
      id: 'clusterSelector',
      component: <ClusterSelector />,
      available: [],
      onSelect: updatePlacementControls,
      summarize: summarizeSelectorControl,
    },

    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  settings  /////////////////////////////////////
    {
      id: 'settingsSection',
      type: 'section',
      title: t('creation.app.section.settings'),
      subgroup: true,
      collapsable: true,
      collapsed: false,
      info: getSharedSubscriptionWarning,
      editing: { editMode: true },
    },
    {
      type: 'custom',
      id: 'timeWindow',
      component: <TimeWindow />,
      available: [],
      reverse: reverseTimeWindow,
      summarize: summarizeTimeWindow,
    },
  ]
}

export default placementData
