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

import TimeWindow, { reverse as reverseTimeWindow, summarize as summarizeTimeWindow } from '../components/TimeWindow'
import ClusterSelector, { summarize as summarizeClusterSelector } from '../components/ClusterSelector'
import { getSharedSubscriptionWarning } from './utils'
import { getSourcePath } from '../../../../components/TemplateEditor'
import { listPlacements } from '../../../../resources'
import { getControlByID } from '../../../../lib/temptifly-utils'
import _ from 'lodash'

const clusterSelectorCheckbox = 'clusterSelector'
const existingRuleCheckbox = 'existing-placement-checkbox'
const unavailable = '-unavailable-'
const nameIndex = 'metadata.name'

export const loadExistingPlacements = (t) => {
  let nsControl = undefined

  return {
    query: () => {
      return listPlacements(nsControl.active).promise
    },
    variables: (control, globalControl) => {
      nsControl = globalControl.find(({ id: idCtrl }) => idCtrl === 'namespace')
    },
    loadingDesc: t('creation.app.loading.rules'),
    setAvailable: setAvailableRules.bind(null),
  }
}

export const getLabels = (clusterSelector) => {
  return clusterSelector?.matchExpressions
    ?.map(({ key, operator, values }) => {
      if (key && operator && (operator === 'DoesNotExist' || operator === 'Exists')) {
        return `${key} "${operator}"`
      }
      if (!key || !operator || !values) {
        return '#invalidExpr'
      }
      return `${key} "${operator}" ${values.join(', ')}`
    })
    .join('; ')
}

export const getMatchLabels = (clusterSelector) => {
  return Object.entries(clusterSelector?.matchLabels ? clusterSelector.matchLabels : {})
    .map(([key, value]) => {
      return `${key}=${value}`
    })
    .join('; ')
}

const setAvailableRules = (control, result) => {
  const { loading } = result
  const { data, i18n } = result
  const placements = data
  control.isLoading = false
  const error = placements ? null : result.error
  if (!control.available) {
    control.available = []
    control.availableData = []
  }
  if (error || placements) {
    if (error) {
      control.isFailed = true
      control.isLoaded = true
    } else if (placements) {
      control.isLoaded = true

      control.availableInfo = {}
      const { groupControlData } = control

      const placementKeyFn = (placement) => {
        let selector = unavailable
        const placementName = _.get(placement, nameIndex, '')
        const predicateSelector = _.get(placement, 'spec.predicates[0].requiredClusterSelector.labelSelector')
        const clusterSelector = predicateSelector || _.get(placement, 'spec.clusterSelector')
        if (_.get(clusterSelector, 'matchExpressions.length', 0) > 0) {
          selector = i18n('creation.app.clusters.expressions', [
            placement.kind,
            placementName,
            getLabels(clusterSelector),
          ])
        } else if (_.get(clusterSelector, 'matchLabels')) {
          selector = i18n('creation.app.clusters.matching', [
            placement.kind,
            placementName,
            getMatchLabels(clusterSelector),
          ])
        }
        control.availableInfo[placementName] = selector
        return placementName
      }

      let placementsAvailableData = {}
      let placementsAvailable = []
      if (placements.length) {
        placementsAvailableData = _.keyBy(placements, placementKeyFn)
        placementsAvailable = _.map(Object.values(placementsAvailableData), placementKeyFn)
          .filter((placementName) => control.availableInfo[placementName] !== unavailable)
          .sort()
      }
      control.availableData = placementsAvailableData
      control.available = placementsAvailable
      control.info = ''

      // if there are no existing placements available
      const existingRuleControl = getControlByID(groupControlData, existingRuleCheckbox)
      existingRuleControl.disabled = control.available.length === 0
      if (control.available.length === 0) {
        control.placeholder = i18n('creation.app.select.no.existing.placement.rule')
        const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
        clusterSelectorControl.onSelect()
      } else {
        control.placeholder = i18n('creation.app.settings.existingRule')
        const selectedPlacementNameControl = getControlByID(groupControlData, 'selectedPlacementName')
        const hasExistingSelection = !!control.active || !!selectedPlacementNameControl?.active
        if (hasExistingSelection) {
          existingRuleControl.onSelect()
        } else {
          const clusterSelectorControl = getControlByID(groupControlData, clusterSelectorCheckbox)
          clusterSelectorControl.onSelect()
        }
      }

      // remove the default placement name if it is not in the available placements list
      // in that case the name was set by the reverse function on control initialization
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
  if (clusterSelectorControl) {
    _.set(clusterSelectorControl, 'active.mode', id === clusterSelectorCheckbox)
  }
  if (existingRuleControl) {
    _.set(existingRuleControl, 'active', id === existingRuleCheckbox)
  }

  // opaque the existing rules combobox
  const selectedRuleComboControl = groupControlData.find(({ id }) => id === 'placementcombo')

  if (existingRuleControl.active) {
    _.set(selectedRuleComboControl, 'validation.required', true)
  }

  if (!existingRuleControl.active) {
    _.set(selectedRuleComboControl, 'validation.required', false)
  }
  _.set(selectedRuleComboControl, 'opaque', id !== existingRuleCheckbox) // && !existingRuleControl.disabled)
  if (id !== existingRuleCheckbox) {
    selectedRuleComboControl.active = ''
    selectedRuleComboControl.info = ''
    const selectedPlacementNameControl = groupControlData.find(({ id }) => id === 'selectedPlacementName')
    if (selectedPlacementNameControl) {
      _.set(selectedPlacementNameControl, 'active', '')
    }
  }

  return groupControlData
}

// existing placement combo box changed; update hidden value used in the template
export const updateSelectedPlacementControls = (control) => {
  const { availableData, availableInfo, groupControlData } = control
  const active = availableData[control.active]
  const kind = _.get(active, 'kind')
  control.info = availableInfo ? availableInfo[control?.active] : ''
  const selectedPlacementNameControl = groupControlData.find(({ id }) => id === 'selectedPlacementName')
  const existingRuleControl = groupControlData.find(({ id }) => id === existingRuleCheckbox)
  const clusterSelectorControl = groupControlData.find(({ id }) => id === clusterSelectorCheckbox)
  if (kind) {
    if (existingRuleControl) {
      _.set(existingRuleControl, 'active', true)
    }
    if (clusterSelectorControl) {
      _.set(clusterSelectorControl, 'active.mode', false)
    }
  }

  if (selectedPlacementNameControl) {
    _.set(selectedPlacementNameControl, 'active', _.get(active, nameIndex))
  }
}

/////////////////////////////////////////////////////////////////////////////
/////////////// when editing, reverse yaml source into these controls /////////////////
/////////////////////////////////////////////////////////////////////////////

//when loading an existing app, pass to the control the placement value that is currently stored by the app
//the reverse() function retrieves this the value out of the existing app template
//the editor needs the existing value to know whether or not the user changed that value
export const reverseExistingPlacement = (control, templateObject) => {
  const { groupControlData } = control
  const existingRuleControl = groupControlData.find(({ id }) => id === existingRuleCheckbox)
  const active = _.get(templateObject, getSourcePath('Subscription[0].spec.placement.placementRef.name'))
  if (existingRuleControl.active && active && control.active === undefined) {
    control.active = active.$v
  }
  return control
}

export const reverseOnline = (control, templateObject) => {
  const legacyActive = _.get(templateObject, getSourcePath('Placement[0].spec.clusterConditions[0].type'))
  const predicateActive = _.get(
    templateObject,
    getSourcePath('Placement[0].spec.predicates[0].requiredClusterSelector.labelSelector.matchExpressions[0].key')
  )
  if (legacyActive || predicateActive?.$v === 'cluster.open-cluster-management.io/condition-available') {
    control.active = true
  }
}

export const summarizeOnline = (control, _globalControlData, summary) => {
  const clusterSelectorControl = getControlByID(control.groupControlData, clusterSelectorCheckbox)
  const existingRuleControl = getControlByID(control.groupControlData, existingRuleCheckbox)
  const existingRuleCombo = getControlByID(control.groupControlData, 'placementcombo')

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
      editing: { editMode: true },
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
      id: 'placementcombo',
      type: 'combobox',
      opaque: false,
      placeholder: t('creation.app.settings.existingRule'),
      reverse: reverseExistingPlacement,
      fetchAvailable: loadExistingPlacements(t),
      onSelect: updateSelectedPlacementControls,
      validation: {
        notification: t('You must select an existing placement.'),
        required: false,
      },
      summarize: () => {},
    },
    {
      id: 'selectedPlacementName',
      type: 'hidden',
      reverse: reverseExistingPlacement,
    },
    {
      id: 'enableHubSelfManagement',
      type: 'hidden',
      active: isLocalCluster,
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
