/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useQuerySearchDisabledManagedClusters } from '~/lib/search'
import { useQuery } from '~/lib/useQuery'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmInlineStatus, AcmPageHeader, StatusType } from '../../../ui-components'

export default function HeaderWithNotification() {
  const { t } = useTranslation()
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const [isSearchDisabled, setIsSearchDisabled] = useState(false)
  const queryDisabled = useQuerySearchDisabledManagedClusters()
  const { data, loading, error } = useQuery(queryDisabled)

  useEffect(() => {
    const items = data?.[0]?.data?.searchResult?.[0]?.items
    setIsSearchDisabled(!loading && !error && Array.isArray(items) && items.length > 0)
  }, [data, loading, error])

  return (
    <AcmPageHeader
      title={isGlobalHub && settings.globalSearchFeatureFlag === 'enabled' ? t('Global search') : t('Search')}
      titleTooltip={
        isGlobalHub &&
        settings.globalSearchFeatureFlag === 'enabled' &&
        t('Global search is enabled. Resources across all your managed hubs and clusters will be shown.')
      }
      actions={
        isSearchDisabled ? (
          <AcmInlineStatus
            key={'search-disabled-warning'}
            type={StatusType.warning}
            status={t('Search is disabled on some clusters.')}
            popover={{
              headerContent: t('Search is disabled on some clusters.'),
              bodyContent: t(
                'Currently, search is disabled on some of your managed clusters. Some data might be missing from the console view.'
              ),
              footerContent: (
                <Link
                  to={`${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20label%3A!local-cluster%3Dtrue"}`}
                >
                  {t('View clusters with search add-on disabled.')}
                </Link>
              ),
            }}
          />
        ) : null
      }
    />
  )
}
