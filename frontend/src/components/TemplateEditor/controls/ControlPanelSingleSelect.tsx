/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { SyntheticEvent, useCallback } from 'react'
import { Spinner, SelectOption } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant, SelectOptionObject } from '../../AcmSelectBase'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import get from 'lodash/get'
import { TFunction } from 'react-i18next'
import { useDynamicPropertyValues } from '../helpers/dynamicProperties'

const ControlPanelSingleSelect = (props: {
  control: any
  controlData: any
  controlId: string
  handleChange: () => void
  i18n: TFunction
}) => {
  const { controlId, i18n, control, controlData, handleChange } = props
  const { footer } = useDynamicPropertyValues(control, controlData, i18n, ['footer'])

  const setControlRef = useCallback(
    (ref: HTMLDivElement | null) => {
      control.ref = ref
    },
    [control]
  )

  const clickRefresh = useCallback(
    (e: SyntheticEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const { fetchAvailable } = control
      if (fetchAvailable) {
        const { refetch } = fetchAvailable
        if (typeof refetch === 'function') {
          refetch()
        }
      }
    },
    [control]
  )

  const onChange = useCallback(
    (value?: SelectOptionObject) => {
      if (control.active !== value) {
        control.active = value
        handleChange()
      }
    },
    [control, handleChange]
  )

  const {
    name,
    active = '',
    available = [],
    exception,
    disabled,
    fetchAvailable,
    isRefetching,
    isLoading,
    isFailed,
  } = control
  let { placeholder = '' } = control
  if (!placeholder) {
    if (isLoading) {
      placeholder = get(control, 'fetchAvailable.loadingDesc', i18n('resource.loading'))
    } else if (isFailed) {
      placeholder = i18n('resource.error')
    } else if (available.length === 0) {
      placeholder = get(control, 'fetchAvailable.emptyDesc', i18n('resource.none'))
    }
  }

  const validated = exception ? 'error' : undefined
  const key = `${controlId}-${name}-${available.join('-')}`
  return (
    <React.Fragment>
      <div className="creation-view-controls-singleselect" ref={setControlRef}>
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          {isLoading || isRefetching ? (
            <div className="creation-view-controls-singleselect-loading  pf-v5-c-form-control">
              <Spinner size="md" />
              <div>{active}</div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <AcmSelectBase
                id={controlId}
                key={key}
                aria-labelledby={`${controlId}-label`}
                spellCheck={false}
                variant={SelectVariant.typeahead}
                onSelect={(value) => {
                  onChange(value)
                }}
                selections={active}
                onClear={() => {
                  onChange(undefined)
                }}
                placeholder={placeholder}
                isDisabled={disabled}
                data-testid={`select-${controlId}`}
                footer={footer}
              >
                {available.map((item: any, inx: React.Key) => {
                  /* eslint-disable-next-line react/no-array-index-key */
                  return <SelectOption key={inx} value={item} />
                })}
              </AcmSelectBase>
              {fetchAvailable && !active && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '40px',
                    cursor: 'pointer',
                  }}
                  role="button"
                  tabIndex={0}
                  className="tf--list-box__refresh-icon"
                  onClick={clickRefresh}
                  onKeyPress={clickRefresh}
                >
                  <svg fillRule="evenodd" height="12" role="img" viewBox="0 0 12 12" width="12">
                    <title>{i18n('Refresh')}</title>
                    <path
                      d="M8.33703191,2.28461538 L6.50516317,0.553494162 L7.02821674,3.11581538e-14 L9.9,2.71384343 L7.02748392,5.41285697 L6.50601674,4.85786795 L8.43419451,3.04615385 L4.95,3.04615385 C2.63677657,3.04615385 0.761538462,4.92139195 0.761538462,7.23461538 C0.761538462,9.54783882 2.63677657,11.4230769 4.95,11.4230769 C7.26322343,11.4230769 9.13846154,9.54783882 9.13846154,7.23461538 L9.9,7.23461538 C9.9,9.9684249 7.68380951,12.1846154 4.95,12.1846154 C2.21619049,12.1846154 0,9.9684249 0,7.23461538 C-1.77635684e-15,4.50080587 2.21619049,2.28461538 4.95,2.28461538 L8.33703191,2.28461538 Z"
                      id="restart"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
          )}
          {validated === 'error' ? (
            <div
              style={{
                borderTop: '1.75px solid red',
                paddingBottom: '6px',
                maxWidth: '600px',
              }}
            ></div>
          ) : (
            <React.Fragment />
          )}
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelSingleSelect
