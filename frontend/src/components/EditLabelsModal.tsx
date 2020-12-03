import { AcmAlert, AcmForm, AcmLabelsInput, AcmModal, AcmSubmit } from '@open-cluster-management/ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import React, { useLayoutEffect, useState } from 'react'
import { patchResource, ResourceError } from '../lib/resource-request'
import { IResource } from '../resources/resource'
import { getErrorInfo } from './ErrorPage'

export function EditLabelsModal(props: { resource?: IResource; close: () => void }) {
    const [labels, setLabels] = useState<Record<string, string> | undefined>({})
    const [error, setError] = useState<{ title: string; subtitle: string } | undefined>()
    useLayoutEffect(() => {
        setLabels(props.resource?.metadata.labels)
    }, [props.resource])

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={`Edit labels`}
            isOpen={props.resource !== undefined}
            onClose={props.close}
        >
            <AcmForm style={{ gap: 0 }}>
                <AcmLabelsInput
                    id="labels-input"
                    label={`${props.resource?.metadata.name} labels`}
                    buttonLabel="Add label"
                    value={labels}
                    onChange={(labels) => setLabels(labels)}
                />
                {error && <AcmAlert {...error} />}
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            setError(undefined)
                            if (props.resource) {
                                // TODO
                                patchResource(props.resource, {
                                    metadata: {
                                        labels,
                                    },
                                })
                                    .promise.then(() => {
                                        props.close()
                                    })
                                    .catch((err) => {
                                        const errorInfo = getErrorInfo(err)
                                        setError({ title: errorInfo.message, subtitle: errorInfo.message })
                                    })
                            }
                        }}
                    >
                        Apply
                    </AcmSubmit>
                    <Button variant="link" onClick={props.close}>
                        Cancel
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmModal>
    )
}
