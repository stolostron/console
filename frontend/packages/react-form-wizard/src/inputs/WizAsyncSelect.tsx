/* Copyright Contributors to the Open Cluster Management project */
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  InputGroup,
  InputGroupItem,
  MenuToggleElement,
  Select as PfSelect,
} from '@patternfly/react-core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { SpinnerButton } from '../components/SpinnerButton'
import { SyncButton } from '../components/SyncButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import { InputSelect, NoResults, SelectListOptions } from './InputSelect'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

type WizAsyncSelectProps = InputCommonProps<string> & {
  label: string
  placeholder?: string
  isCreatable?: boolean
  asyncCallback?: () => Promise<string[]>
  footer?: ReactNode
}

export function WizAsyncSelect(props: WizAsyncSelectProps) {
  const { asyncCallback, isCreatable, footer } = props
  const { displayMode, value, setValue, validated, hidden, id, disabled } = useInput(props)
  const placeholder = getSelectPlaceholder(props)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const onSelect = useCallback(
    (selectedString: string | undefined) => {
      setValue(selectedString)
      setOpen(false)
    },
    [setValue]
  )

  const handleSetOptions = useCallback((o: string[]) => {
    if (o.length > 0) {
      setFilteredOptions(o)
    } else {
      setFilteredOptions([NoResults])
    }
  }, [])

  const sync = useCallback(() => {
    if (displayMode !== DisplayMode.Step) return
    if (asyncCallback) {
      setLoading((loading) => {
        if (loading) return loading
        if (asyncCallback) {
          asyncCallback()
            .then((options) => {
              if (Array.isArray(options) && options.every((option) => typeof option === 'string')) {
                setOptions(options)
                setFilteredOptions(options)
              } else {
                // eslint-disable-next-line no-console
                console.warn('AsyncSelect: options is not an array of strings')
                setOptions([])
              }
            })
            .catch(() => null)
            .finally(() => setLoading(false))
          return true
        }
        return false
      })
    }
  }, [asyncCallback, displayMode])

  useEffect(() => sync(), [sync])

  if (hidden) return null

  if (displayMode === DisplayMode.Details) {
    if (!value) return null
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{props.label}</DescriptionListTerm>
        <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  return (
    <WizFormGroup {...props} id={id}>
      <InputGroup>
        <InputGroupItem isFill>
          <PfSelect
            onOpenChange={(isOpen) => {
              !isOpen && setOpen(false)
            }}
            isOpen={open}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <InputSelect
                disabled={disabled || (loading && !isCreatable)}
                validated={validated}
                placeholder={placeholder}
                options={options}
                setOptions={handleSetOptions}
                toggleRef={toggleRef}
                value={value}
                onSelect={onSelect}
                open={open}
                setOpen={setOpen}
              />
            )}
            selected={value}
            onSelect={(_event, value) => onSelect(value?.toString() ?? '')}
            shouldFocusFirstItemOnOpen={false}
          >
            <SelectListOptions options={filteredOptions} value={value} isCreatable={isCreatable} footer={footer} />
          </PfSelect>
        </InputGroupItem>
        {props.asyncCallback && loading && <SpinnerButton />}
        {props.asyncCallback && !loading && <SyncButton onClick={sync} />}
      </InputGroup>
    </WizFormGroup>
  )
}
