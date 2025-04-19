/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmForm, AcmFormProvider, AcmModal, AcmSelect, AcmSubmit } from '../ui-components'
import { ActionGroup, Button, ButtonVariant, ModalVariant, SelectOption } from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../lib/acm-i18next'
import { IRequestResult } from '../resources/utils'

export interface IDropdownActionModalProps<T = undefined> {
  open: true
  action: string
  title: string
  processing: string
  selectOptions: Array<string>
  resource: T
  close: () => void
  onCancel?: () => void
  description: string | React.ReactNode
  actionFn?: (item: T, selection: string) => IRequestResult
  isDanger?: boolean
  isValidError?: (error: Error) => boolean
  emptyState?: JSX.Element
  selectLabel: string
  selectPlaceholder: string
  confirmText: string
}

interface ItemError<T> {
  item: T
  error: Error
}

export function DropdownActionModal<T = unknown>(props: IDropdownActionModalProps<T> | { open: false }) {
  const { t } = useTranslation()
  const [error, setError] = useState<ItemError<T> | undefined>()
  const [selection, setSelection] = useState<string | undefined>('')

  useEffect(() => {
    setError(undefined)
  }, [props.open])

  if (props.open === false) {
    return <></>
  }

  return (
    <AcmFormProvider>
      <AcmModal variant={ModalVariant.medium} title={props.title} isOpen={true} onClose={props.close}>
        <AcmForm style={{ gap: 0 }}>
          {!error ? (
            <Fragment>
              {props.description}
              <AcmSelect
                id="modal-selector"
                toggleId="modal-selector-toggal"
                label={props.selectLabel}
                placeholder={props.selectPlaceholder}
                value={selection}
                onChange={(selection) => {
                  setSelection(selection)
                }}
                isRequired
              >
                {props.selectOptions.map((option) => (
                  <SelectOption key={option} value={option}>
                    {option}
                  </SelectOption>
                ))}
              </AcmSelect>
            </Fragment>
          ) : (
            <Fragment>
              <AcmAlert
                isInline
                noClose
                variant="danger"
                title={t('there.were.errors')}
                message={error.error.message}
              />
              <div style={{ minHeight: '24px' }} />
            </Fragment>
          )}
          <ActionGroup>
            {error
              ? [
                  <Button variant="primary" key="close-action" onClick={props.close}>
                    {t('Close')}
                  </Button>,
                ]
              : [
                  <AcmSubmit
                    key="submit-action"
                    id="submit-button"
                    isDisabled={!selection}
                    variant={props.isDanger ? ButtonVariant.danger : ButtonVariant.primary}
                    onClick={async () => {
                      const error: ItemError<T>[] = []

                      if (props.actionFn) {
                        props
                          .actionFn(props.resource, selection as string)
                          .promise.catch((err) => {
                            console.log(err)
                            setError(err)
                            error.push(err)
                          })
                          .then(() => {
                            if (error.length === 0) props.close()
                          })
                      }
                    }}
                    label={props.action}
                    processingLabel={props.processing}
                  />,
                  <Button
                    variant="link"
                    onClick={props.onCancel ? props.onCancel : props.close}
                    key="cancel-bulk-action"
                  >
                    {t('cancel')}
                  </Button>,
                ]}
          </ActionGroup>
        </AcmForm>
      </AcmModal>
    </AcmFormProvider>
  )
}
