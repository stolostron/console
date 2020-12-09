import { AcmAlert, AcmForm, AcmLabelsInput, AcmModal, AcmSubmit } from '@open-cluster-management/ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { patchResource } from '../lib/resource-request'
import { IResource } from '../resources/resource'
import { getErrorInfo } from './ErrorPage'

export function EditLabelsModal(props: { resource?: IResource; close: () => void }) {
    const { t } = useTranslation(['labels'])

    const [labels, setLabels] = useState<Record<string, string>>({})
    const [error, setError] = useState<{ title: string; subtitle: string } | undefined>()
    useLayoutEffect(() => {
        const labels = props.resource?.metadata.labels ?? {}
        setLabels({ ...labels })
    }, [props.resource])

    return (
        <AcmModal
            variant={ModalVariant.medium}
            title={t('edit.labels.title')}
            isOpen={props.resource !== undefined}
            onClose={props.close}
        >
            <AcmForm style={{ gap: 0 }}>
                <div>{t('labels.description')}</div>
                &nbsp;
                <AcmLabelsInput
                    id="labels-input"
                    label={`${props.resource?.metadata.name} labels`}
                    buttonLabel="Add label"
                    value={labels}
                    onChange={(labels) => setLabels(labels!)}
                />
                {error && <AcmAlert {...error} />}
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            setError(undefined)
                            let patch: { op: string; path: string; value?: unknown }[] = []
                            /* istanbul ignore else */
                            if (props.resource!.metadata.labels) {
                                patch = [
                                    ...patch,
                                    ...Object.keys(props.resource!.metadata.labels).map((key) => ({
                                        op: 'remove',
                                        path: `/metadata/labels/${key}`,
                                    })),
                                ]
                            }
                            patch = [
                                ...patch,
                                ...Object.keys(labels).map((key) => ({
                                    op: 'add',
                                    path: `/metadata/labels/${key}`,
                                    value: labels[key],
                                })),
                            ]
                            return patchResource(props.resource!, patch)
                                .promise.then(() => {
                                    props.close()
                                })
                                .catch((err) => {
                                    const errorInfo = getErrorInfo(err)
                                    setError({ title: errorInfo.message, subtitle: errorInfo.message })
                                })
                        }}
                        label={t('save')}
                        processingLabel={t('saving')}
                    ></AcmSubmit>
                    <Button variant="link" onClick={props.close}>
                        {t('cancel')}
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmModal>
    )
}
