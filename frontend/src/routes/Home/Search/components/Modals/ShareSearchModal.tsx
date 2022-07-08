/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ModalVariant } from '@patternfly/react-core'
import { AcmCodeSnippet, AcmModal } from '@stolostron/ui-components'
import { Fragment } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { SavedSearch } from '../../../../../resources/userpreference'

export const ShareSearchModal = (props: { onClose: () => void; shareSearch: SavedSearch }) => {
    const { onClose, shareSearch } = props
    const { t } = useTranslation()
    function GetUrl() {
        let url = decodeURIComponent(window.location.origin + window.location.pathname)
        return (url += `?filters={"textsearch":"${encodeURIComponent(shareSearch.searchText)}"}`)
    }

    return (
        <Fragment>
            <AcmModal
                title={t('Share search')}
                variant={ModalVariant.small}
                isOpen={shareSearch !== undefined}
                onClose={onClose}
                actions={[]}
            >
                <p>{t('Copy this private URL to share')}</p>
                <AcmCodeSnippet
                    id="snippet"
                    command={GetUrl()}
                    copyTooltipText={t('Copy to clipboard')}
                    copySuccessText={t('Copied!')}
                />
            </AcmModal>
        </Fragment>
    )
}
