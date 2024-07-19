/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { Card, CardBody } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmInlineStatus, AcmPageHeader, StatusType } from '../../../ui-components'
import { Message } from '../search-sdk/search-sdk'

export default function HeaderWithNotification(props: { messages: Message[] }) {
  const { t } = useTranslation()
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const { messages } = props

  return (
    <div style={{ outline: 'none', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <AcmPageHeader
          title={isGlobalHub && settings.globalSearchFeatureFlag === 'enabled' ? t('Global search') : t('Search')}
          titleTooltip={
            isGlobalHub &&
            settings.globalSearchFeatureFlag === 'enabled' &&
            t('Global search is enabled. Resources across all your managed hubs and clusters will be shown.')
          }
        />
      </div>

      {messages.map((msg, index) => {
        const displayShortText = t('Search is disabled on some clusters.') || msg?.description
        const displayLongText =
          t(
            'Currently, search is disabled on some of your managed clusters. Some data might be missing from the console view.'
          ) || msg?.description
        const footerText = t('View clusters with search add-on disabled.')

        return (
          <Card key={msg.id + index} style={{ border: 'none', boxShadow: 'none' }}>
            <CardBody>
              <AcmInlineStatus
                type={StatusType.warning}
                status={displayShortText}
                popover={{
                  headerContent: displayShortText,
                  bodyContent: displayLongText,
                  footerContent: msg.id === 'S20' && (
                    <a
                      href={`${NavigationPath.search}?filters={"textsearch":"kind%3ACluster%20addon%3Asearch-collector%3Dfalse%20name%3A!local-cluster"}`}
                    >
                      {footerText}
                    </a>
                  ),
                }}
              />
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
