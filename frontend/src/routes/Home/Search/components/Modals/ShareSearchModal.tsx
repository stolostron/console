/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ClipboardCopy, ModalVariant } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { SavedSearch } from '../../../../../resources/userpreference'
import { AcmModal } from '../../../../../ui-components'

export const ShareSearchModal = (props: { onClose: () => void; shareSearch: SavedSearch }) => {
  const { onClose, shareSearch } = props
  const { t } = useTranslation()
  function GetUrl() {
    return (
      decodeURIComponent(window.location.origin + window.location.pathname) +
      `?filters={"textsearch":"${encodeURIComponent(shareSearch.searchText)}"}`
    )
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
        <ClipboardCopy isReadOnly={true} hoverTip={t('Copy to clipboard')} clickTip={t('Copied!')}>
          {GetUrl()}
        </ClipboardCopy>
      </AcmModal>
    </Fragment>
  )
}
