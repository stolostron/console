/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { Fragment } from 'react'
import { ModalVariant } from '@patternfly/react-core'
import { AcmCodeSnippet, AcmModal } from '@open-cluster-management/ui-components'
import { useTranslation } from '../../../../../lib/acm-i18next'

export const ShareSearchModal = (props: any) => {
    const { t } = useTranslation()
    function GetUrl() {
        let url = decodeURIComponent(window.location.origin + window.location.pathname)
        const search = props.shareSearch ? props.shareSearch.searchText : ''
        return (url += `?filters={"textsearch":"${encodeURIComponent(search)}"}`)
    }

    return (
        <Fragment>
            <AcmModal
                title={t('Share search')}
                variant={ModalVariant.small}
                isOpen={props.shareSearch !== undefined}
                onClose={props.onClose}
                actions={[]}
            >
                <p>Copy this private URL to share</p>
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
