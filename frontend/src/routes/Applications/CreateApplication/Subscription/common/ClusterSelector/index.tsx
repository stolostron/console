/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useCallback, useState } from 'react'
import { AcmMultiSelect, AcmSelect } from '../../../../../../ui-components'
import { SelectVariant } from '../../../../../../components/AcmSelectBase'
import {
  Radio,
  FormGroup,
  Accordion,
  AccordionItem,
  AccordionContent,
  Popover,
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  SelectOption,
} from '@patternfly/react-core'
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import _ from 'lodash'
import './style.css'
import { TFunction } from 'react-i18next'
import Tooltip from '../../../../../../components/TemplateEditor/components/Tooltip'
import { ManagedClusterSet, ManagedClusterSetBindingKind } from '../../../../../../resources'
import { getTemplateValue } from '../../../../../Infrastructure/Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../../shared-recoil'
import YAML from 'yaml'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useLabelValuesMap } from '../../../../../../wizards/common/useLabelValuesMap'

const activeModeStr = 'active.mode'

const ClusterSelector = (props: {
  control: any
  controlId: string
  handleChange: any
  locale: string
  i18n: TFunction
  templateYAML: string
}) => {
  const { t } = useTranslation()
  const { managedClustersState, managedClusterSetsState, managedClusterSetBindingsState } = useSharedAtoms()
  const clusterSets = useRecoilValue(managedClusterSetsState)
  const managedClusters = useRecoilValue(managedClustersState)
  const managedClusterSetBindings = useRecoilValue(managedClusterSetBindingsState)

  const { controlId, locale, control, i18n } = props
  const { name, active, forceUpdate, validation = {} } = control
  const modeSelected = active && active.mode === true
  const isExistingRule = control.showData?.length > 0
  const isReadOnly = isExistingRule || !modeSelected
  const hasLabels = _.get(active, 'clusterLabelsList.0.labelValue') !== ''
  const [selectedClusterSets, setSelectedClusterSets] = useState<string[] | undefined>(undefined)
  const [hideValue, setHideValue] = useState<boolean>(false)

  const labelValuesMap = useLabelValuesMap(managedClusters)

  control.validation = (exceptions: { row: number; text: string; type: string; controlId: string }[]) => {
    const { control, i18n } = props
    if (_.get(control, activeModeStr, false)) {
      const labelNameSet = new Set()
      control.active.clusterLabelsList.map(
        (item: { id: number; labelName: string; validValue: boolean; operatorValue: string }) => {
          const { id, labelName } = item

          if (labelNameSet.has(labelName)) {
            exceptions.push({
              row: 1,
              text: i18n('creation.duplicate.clusterSelector.label', [labelName]),
              type: 'error',
              controlId: `labelName-${id}`,
            })
          }
          labelNameSet.add(labelName)
        }
      )
      if (!control.active.clusterSetsList.length) {
        // throw error if no cluster set is selected
        exceptions.push({
          row: 1,
          text: i18n('Select at least one cluster set to deploy application resources.'),
          type: 'error',
          controlId: control.active.clusterLabelsListID,
        })
      }
    }
  }

  if (_.isEmpty(active)) {
    if (!control.showData || control.showData.length === 0) {
      control.active = {
        mode: false,
        clusterLabelsList: [{ id: 0, labelName: '', labelValue: [], operatorValue: 'In', validValue: false }],
        clusterLabelsListID: 1,
        clusterSetsList: [],
      }
    } else {
      //display existing placement rule
      control.active = {
        mode: false,
        clusterLabelsList: control.showData,
        clusterLabelsListID: control.showData.length,
      }
    }
  }

  const handleMode = () => {
    const { control, handleChange } = props
    const { active } = control
    if (active) {
      active.mode = true
    }

    handleChange(control)
  }

  const handleChange = useCallback(
    (value: string | object | string[], targetName?: string, targetID?: string | number) => {
      const { control, handleChange } = props

      if (targetName) {
        const { active } = control
        const { clusterLabelsList } = active
        if (clusterLabelsList && clusterLabelsList[targetID!]) {
          if (targetName === 'labelName') {
            clusterLabelsList[targetID!].labelName = value
          } else if (targetName === 'labelValue') {
            clusterLabelsList[targetID!].labelValue = value
          } else if (targetName === 'operatorValue') {
            clusterLabelsList[targetID!].operatorValue = value
          }
          clusterLabelsList[targetID!].validValue = true
        }
      }
      handleChange(control)
    },
    [props]
  )

  const addClusterSetToControl = (clusterSets: string[]) => {
    const { control, templateYAML } = props
    const { active } = control
    const { clusterSetsList } = active
    const namespace = getTemplateValue(templateYAML, 'namespace', '', 0)
    let templateObject: any[]
    try {
      templateObject = YAML.parseAllDocuments(templateYAML).map((doc) => doc.toJSON())
    } catch {
      return t('validate.yaml.not.valid')
    }
    clusterSets.forEach((clusterSet) => {
      // check if the cluster set obj exist in clusterSetsList
      if (!clusterSetsList.find((item: { clusterSetName: string }) => item.clusterSetName === clusterSet)) {
        const existManagedClusterSetBinding = managedClusterSetBindings.find(
          (clusterSetBinding) =>
            clusterSetBinding.metadata.name === clusterSet && clusterSetBinding.metadata.namespace === namespace
        )

        const managedClusterSetBindingResources = templateObject.filter(
          (obj) => obj.kind === ManagedClusterSetBindingKind && obj.metadata.name === clusterSet
        )

        const isExistManagedClusterSetBinding =
          existManagedClusterSetBinding !== undefined || managedClusterSetBindingResources.length > 0

        clusterSetsList.push({
          clusterSetName: clusterSet,
          existManagedClusterSetBinding: isExistManagedClusterSetBinding ? true : false,
        })
      }
    })

    // remove deleted cluster set from clusterSetsList
    const removed = clusterSetsList.filter(
      (list: { clusterSetName: string }) => !clusterSets.includes(list.clusterSetName)
    )
    if (removed) {
      removed.forEach((list: { clusterSetName: string }) => {
        clusterSetsList.splice(
          clusterSetsList.findIndex(function (i: { clusterSetName: string }) {
            return i === list
          }),
          1
        )
      })
    }

    handleChange(control)

    setSelectedClusterSets(clusterSets)
  }

  const addLabelToList = useCallback(
    (control: any, modeSelected?: boolean) => {
      if (modeSelected) {
        // Create new "label" item
        control.active.clusterLabelsList.push({
          id: control.active.clusterLabelsListID,
          labelName: '',
          labelValue: [],
          operatorValue: 'In',
          validValue: true,
        })
        control.active.clusterLabelsListID++

        // Update UI
        forceUpdate()
      }
    },
    [forceUpdate]
  )

  const removeLabelFromList = useCallback(
    (control: { active: any }, item: { id: any }, isReadOnly?: boolean | undefined) => {
      if (!isReadOnly) {
        // Removed labels are no longer valid
        const labelIndexToRemove = control.active.clusterLabelsList.findIndex((clsLabel: any) => clsLabel.id == item.id)
        control.active.clusterLabelsList.splice(labelIndexToRemove, 1)

        // Update UI and yaml editor
        forceUpdate()
        handleChange({})
      }
    },
    [forceUpdate, handleChange]
  )

  const operatorOptions = [
    { label: i18n('equals any of'), value: 'In' },
    { label: i18n('does not equal any of'), value: 'NotIn' },
    { label: i18n('exists'), value: 'Exists' },
    { label: i18n('does not exist'), value: 'DoesNotExist' },
  ]

  const renderClusterLabels = (
    control: { active: { clusterLabelsList: any[] } },
    isReadOnly: boolean | undefined,
    controlId: string,
    i18n: TFunction
  ) => {
    if (!_.get(control, 'active.clusterLabelsList')) {
      return ''
    }
    return (
      control.active &&
      control.active.clusterLabelsList.map((item) => {
        const { id, labelName, labelValue, validValue, operatorValue } = item
        const value = labelName === '' ? '' : labelName
        const operator = operatorValue === '' ? '' : operatorValue
        const matchLabelValue = labelValue === '' ? '' : labelValue

        if (validValue || id === 0) {
          return (
            <Fragment key={id}>
              <div className="matching-labels-container" style={{ display: 'flex', marginBottom: '20px' }}>
                <div className="matching-labels-input" style={{ marginRight: '10px' }}>
                  <Flex>
                    <FlexItem>
                      <AcmSelect
                        id={`labelName-${id}-${controlId}`}
                        label={i18n('clusterSelector.label.field.ui')}
                        value={value}
                        placeholder={i18n('Select the label')}
                        onChange={(label) => {
                          handleChange(label!, 'labelName', id)
                        }}
                      >
                        {Object.keys(labelValuesMap)?.map((option) => (
                          <SelectOption key={option} value={option}>
                            {option}
                          </SelectOption>
                        ))}
                      </AcmSelect>
                    </FlexItem>

                    <FlexItem>
                      <AcmSelect
                        id={`operator-${id}-${controlId}`}
                        label={i18n('Operator')}
                        value={operator}
                        onChange={(operator) => {
                          handleChange(operator!, 'operatorValue', id)
                          switch (operator) {
                            case 'Exists':
                            case 'DoesNotExist':
                              setHideValue(true)
                              break
                          }
                        }}
                      >
                        {operatorOptions.map((option) => (
                          <SelectOption key={option.value} value={option.value}>
                            {option.label}
                          </SelectOption>
                        ))}
                      </AcmSelect>
                    </FlexItem>

                    <FlexItem>
                      {!hideValue && (
                        <AcmMultiSelect
                          id={`labelValue-${id}-${controlId}`}
                          label={i18n('clusterSelector.value.field.ui')}
                          value={matchLabelValue}
                          placeholder={i18n('Select the values')}
                          onChange={(value) => handleChange(value!, 'labelValue', id)}
                        >
                          {labelValuesMap[labelName]?.map((value: any) => (
                            <SelectOption key={value} value={value}>
                              {value}
                            </SelectOption>
                          ))}
                        </AcmMultiSelect>
                      )}
                    </FlexItem>
                  </Flex>
                </div>

                {id !== 0 ? ( // Option to remove added labels
                  <Button
                    id={id}
                    isDisabled={isReadOnly}
                    variant={ButtonVariant.link}
                    onClick={() => removeLabelFromList(control, item, isReadOnly)}
                    aria-label={i18n('Remove label')}
                    icon={<TimesCircleIcon />}
                    size="sm"
                  />
                ) : (
                  ''
                )}
              </div>
            </Fragment>
          )
        }
        return ''
      })
    )
  }

  return (
    <Fragment>
      <div className="creation-view-controls-labels">
        <div>
          {name}
          {validation.required ? <div className="creation-view-controls-required">*</div> : null}
          <Tooltip control={control} locale={locale} />
        </div>

        <div className="clusterSelector-container" style={{ fontSize: '14px', position: 'relative' }}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div style={{ display: 'flex', alignItems: 'center' }} onClick={handleMode}>
            <Radio
              className="clusterSelector-checkbox"
              isChecked={modeSelected}
              isDisabled={isExistingRule}
              id={`clusterSelector-checkbox-${controlId}`}
              onChange={handleMode}
              name={'clusterSelector-checkbox'}
              aria-label={i18n('creation.app.settings.clusterSelector')}
            />
            <FormGroup
              id="clusterSelector-container"
              label={i18n('creation.app.settings.clusterSelector')}
              labelIcon={
                /* istanbul ignore next */
                <Popover
                  id={`${controlId}-label-help-popover`}
                  bodyContent={i18n('creation.app.settings.selectorClusters.config')}
                >
                  <Button
                    variant="plain"
                    id={`${controlId}-label-help-button`}
                    aria-label="More info"
                    onClick={(e) => e.preventDefault()}
                    className="pf-v5-c-form__group-label-help"
                    style={{ ['--pf-v5-c-form__group-label-help--TranslateY' as any]: 0 }}
                    icon={<HelpIcon />}
                  />
                </Popover>
              }
              fieldId={'clusterSelector-container'}
            />
          </div>
          <div style={!modeSelected ? { pointerEvents: 'none', opacity: 0.3 } : {}}>
            <Accordion style={{ display: 'block' }}>
              <AccordionItem>
                <AccordionContent>
                  <div className="clusterSelector-labels-section">
                    <div
                      className="labels-section"
                      style={{ display: 'block' }}
                      id={`clusterSelector-labels-section-${controlId}`}
                    >
                      <AcmMultiSelect
                        id="cluster-sets"
                        label={i18n('Cluster sets')}
                        placeholder={i18n('Select the cluster sets')}
                        value={selectedClusterSets}
                        variant={SelectVariant.typeaheadMulti}
                        onChange={(clusterSets) => addClusterSetToControl(clusterSets!)}
                        isRequired
                      >
                        {clusterSets.map((clusterset: ManagedClusterSet) => (
                          <SelectOption key={clusterset.metadata.uid} value={clusterset.metadata.name}>
                            {clusterset.metadata.name}
                          </SelectOption>
                        ))}
                      </AcmMultiSelect>
                      {renderClusterLabels(control, isReadOnly, controlId, i18n)}
                      {hasLabels && (
                        <Button
                          isDisabled={isReadOnly}
                          variant={ButtonVariant.link}
                          onClick={() => addLabelToList(control, !isReadOnly)}
                          icon={<PlusCircleIcon />}
                          size="sm"
                        >
                          {i18n('creation.app.settings.selectorClusters.prop.add')}
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default ClusterSelector

export const summarize = (control: any, summary: string[]) => {
  const { clusterLabelsList } = control.active || {}
  if (clusterLabelsList && _.get(control, 'type', '') !== 'hidden' && _.get(control, activeModeStr)) {
    clusterLabelsList.forEach((item: { labelValue: string[]; labelName: string }) => {
      if (item.labelName && item.labelValue) {
        summary.push(`${item.labelName}=${item.labelValue}`)
      }
    })
  }
}

export const summary = (control: any) => {
  const { clusterLabelsList } = control.active || {}
  if (clusterLabelsList && _.get(control, 'type', '') !== 'hidden' && _.get(control, activeModeStr)) {
    const labels: string[] = []
    clusterLabelsList.forEach((item: { labelValue: string[]; labelName: string }) => {
      if (item.labelName && item.labelValue) {
        labels.push(`${item.labelName}=${item.labelValue}`)
      }
    })
    return [
      {
        term: 'Selector labels',
        desc: labels.join(', '),
      },
    ]
  }
}
