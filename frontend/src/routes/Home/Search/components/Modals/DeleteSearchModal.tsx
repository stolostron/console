/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { Fragment, useState, useEffect } from 'react'
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { AcmModal, AcmButton, AcmAlert } from '@open-cluster-management/ui-components'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { SavedSearchesDocument, useDeleteSearchMutation } from '../../search-sdk/search-sdk'
import { searchClient } from '../../search-sdk/search-client'

export const DeleteSearchModal = (props: any) => {
    const { t } = useTranslation()
    const [deleteSearchMutation, { error }] = useDeleteSearchMutation({
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })
    const [isError, setIsError] = useState<boolean>(false)

    useEffect(() => {
        setIsError(false)
    }, [props.deleteSearch])

    const deleteSearch = () => {
        deleteSearchMutation({
            variables: {
                resource: {
                    name: props.deleteSearch.name,
                },
            },
            refetchQueries: [{ query: SavedSearchesDocument }],
        }).then((res) => {
            if (res.errors) {
                setIsError(true)
                return null
            }
            props.onClose()
            return null
        })
    }

    return (
        <Fragment>
            <AcmModal
                variant={ModalVariant.medium}
                isOpen={props.deleteSearch !== undefined}
                title={t('Delete saved search?')}
                titleIconVariant={'warning'}
                onClose={props.onClose}
                actions={[
                    <AcmButton key="confirm" variant={ButtonVariant.danger} onClick={() => deleteSearch()}>
                        {t('Delete')}
                    </AcmButton>,
                    <AcmButton key="cancel" variant={ButtonVariant.link} onClick={props.onClose}>
                        {t('Cancel')}
                    </AcmButton>,
                ]}
            >
                {isError && (
                    <AcmAlert
                        data-testid={'delete-saved-search-error'}
                        noClose
                        variant={'danger'}
                        title={error!.message}
                    />
                )}
                {/* TODO - Handle interpolation */}
                <p>
                    {t('Are you sure that you want to delete saved search {{savedSearchName}}?', {
                        savedSearchName: props.deleteSearch?.name,
                    })}
                </p>
            </AcmModal>
        </Fragment>
    )
}
