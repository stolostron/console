import { AcmButton } from '@open-cluster-management/ui-components'
import {
    Backdrop,
    Bullseye,
    Card,
    CardBody,
    EmptyState,
    EmptyStateIcon,
    EmptyStatePrimary,
    Spinner,
    Title,
} from '@patternfly/react-core'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon'
import ErrorIcon from '@patternfly/react-icons/dist/js/icons/error-circle-o-icon'
import React, { useEffect, useState } from 'react'
import { IRequestResult, ResourceError, ResourceErrorCode } from '../lib/resource-request'
import { ErrorState } from './ErrorPage'

export interface IRequestModalProps {
    open: boolean
    title: string
    close: (success: boolean) => void
    action: () => IRequestResult
    canRetry?: boolean
}

export function RequestModal(props: Partial<IRequestModalProps>) {
    const { open, close, action, title } = props
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<Error>()
    const [showCancel, setShowCancel] = useState(false)
    const [result, setResult] = useState<IRequestResult>()

    useEffect(() => {
        setSuccess(false)
        setError(undefined)
        setShowCancel(false)
        if (action !== undefined) {
            const result = action()
            result.promise.catch((err) => {})
            setResult(result)
            new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
                setShowCancel(true)
                result.promise
                    .then(() => {
                        setSuccess(true)
                        setTimeout(() => close?.(true), 1000)
                    })
                    .catch((err) => {
                        if (err instanceof ResourceError) {
                            if (err.code === ResourceErrorCode.RequestCancelled) {
                                close?.(false)
                            } else {
                                setError(err)
                            }
                        } else {
                            setError(err)
                        }
                    })
            })
            return () => {
                result.abort()
            }
        }
    }, [close, action, props])

    if (!open) return <></>

    return (
        <Backdrop>
            <Bullseye>
                <Card style={{ borderRadius: '4px' }}>
                    <CardBody>
                        {error ? (
                            <ErrorState
                                error={error}
                                actions={
                                    <AcmButton
                                        id="cancel-button"
                                        key="cancel-button"
                                        name="cancel-button"
                                        variant="primary"
                                        onClick={() => {
                                            result?.abort?.()
                                            close?.(false)
                                        }}
                                        autoFocus
                                    >
                                        Close
                                    </AcmButton>
                                }
                            />
                        ) : (
                            <EmptyState>
                                {success ? (
                                    <EmptyStateIcon icon={CheckIcon} style={{ color: 'green', minHeight: '74px' }} />
                                ) : error ? (
                                    <EmptyStateIcon icon={ErrorIcon} />
                                ) : (
                                    <EmptyStateIcon variant="container" component={Spinner} />
                                )}
                                <Title size="lg" headingLevel="h4">
                                    {title}
                                </Title>

                                <EmptyStatePrimary style={{ minHeight: '36px' }}>
                                    {success ? (
                                        <AcmButton
                                            id="cancel-button"
                                            key="cancel-button"
                                            name="cancel-button"
                                            variant="primary"
                                            onClick={() => {
                                                close?.(true)
                                            }}
                                            autoFocus
                                        >
                                            Success
                                        </AcmButton>
                                    ) : (
                                        showCancel && (
                                            <AcmButton
                                                id="cancel-button"
                                                key="cancel-button"
                                                name="cancel-button"
                                                variant="primary"
                                                onClick={() => {
                                                    result?.abort?.()
                                                    close?.(false)
                                                }}
                                                autoFocus
                                            >
                                                Cancel
                                            </AcmButton>
                                        )
                                    )}
                                </EmptyStatePrimary>
                            </EmptyState>
                        )}
                    </CardBody>
                </Card>
            </Bullseye>
        </Backdrop>
    )
}
