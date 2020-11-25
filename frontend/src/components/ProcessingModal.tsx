import { AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { ModalVariant, Spinner } from '@patternfly/react-core'
import React, { Fragment, ReactNode, useEffect, useState } from 'react'
import { IRequestResult, ResourceError, ResourceErrorCode } from '../lib/resource-request'
import { ErrorState } from './ErrorPage'

export interface IRequestModalProps {
    open: boolean
    setOpen: (open: boolean) => void

    action: () => IRequestResult
    canRetry: boolean

    title: string
}

export function RequestModal(props: Partial<IRequestModalProps>) {
    const { open, setOpen, action, title, message } = props
    const [buttons, setButtons] = useState<ReactNode[]>()
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<Error>()
    const [cancel, setCancel] = useState<() => void>()
    const [showCancel, setShowCancel] = useState(false)

    useEffect(() => {
        setSuccess(false)
        setError(undefined)
        setShowCancel(false)
        if (action) {
            const { promise, abort } = action()
            promise
                .then(() => setSuccess(true))
                .catch((err) => {
                    if (err instanceof ResourceError) {
                        if (err.code === ResourceErrorCode.Abort) {
                            setOpen?.(false)
                        }
                    }
                    setError(err)
                })
            const timeout = setTimeout(() => setShowCancel(true), 2 * 1000)
            return () => {
                clearTimeout(timeout)
                abort()
            }
        }
    }, [action])

    setButtons([
        <AcmButton
            key="cancel"
            variant="link"
            onClick={() => {
                // props.cancel?.()
            }}
        >
            Cancel
        </AcmButton>,
    ])
    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={title}
            isOpen={open}
            actions={
                <Fragment>
                    {setShowCancel && setOpen && abort && (
                        <AcmButton
                            key="cancel"
                            variant="link"
                            onClick={() => {
                                // cancel?.()
                                abort()
                            }}
                        >
                            Cancel
                        </AcmButton>
                    )}
                </Fragment>
            }
        >
            {title}
            {!success && !error && <Spinner />}
            {success && <span>Success</span>}
            {error && <ErrorState error={error} />}
        </AcmModal>
    )
}
