/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { AcmAlert, AcmButton, AcmModal } from '../../../../../ui-components'
import { Fragment, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { patchUserPreference, SavedSearch, UserPreference } from '../../../../../resources/userpreference'

export const DeleteSearchModal = (props: {
    onClose: () => void
    searchToDelete?: SavedSearch
    userPreference?: UserPreference
}) => {
    const { onClose, searchToDelete, userPreference } = props
    const { t } = useTranslation()
    const [deleteError, setDeleteError] = useState<string | undefined>()

    return (
        <Fragment>
            <AcmModal
                variant={ModalVariant.medium}
                isOpen={searchToDelete !== undefined}
                title={t('Delete saved search?')}
                titleIconVariant={'warning'}
                onClose={onClose}
                actions={[
                    <AcmButton
                        key="confirm"
                        variant={ButtonVariant.danger}
                        onClick={() => {
                            setDeleteError(undefined)
                            if (userPreference && searchToDelete) {
                                patchUserPreference(userPreference, 'remove', searchToDelete)
                                    .promise.then(() => props.onClose())
                                    .catch((err) => {
                                        if (err && err.message) {
                                            setDeleteError(err.message)
                                        } else {
                                            setDeleteError('There was an error while performing the delete request.')
                                        }
                                    })
                            }
                        }}
                    >
                        {t('Delete')}
                    </AcmButton>,
                    <AcmButton key="cancel" variant={ButtonVariant.link} onClick={onClose}>
                        {t('Cancel')}
                    </AcmButton>,
                ]}
            >
                {deleteError && (
                    <AcmAlert
                        data-testid={'delete-saved-search-error'}
                        noClose
                        variant={'danger'}
                        title={deleteError}
                    />
                )}
                <p>
                    {t('Are you sure that you want to delete saved search {{savedSearchName}}?', {
                        savedSearchName: searchToDelete?.name,
                    })}
                </p>
            </AcmModal>
        </Fragment>
    )
}
