/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import '@patternfly/react-core/dist/styles/base.css'
import { useTranslation } from 'react-i18next'
import { AcmPageHeader, AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { Message } from '../../../search-sdk/search-sdk'
import { Card, CardBody } from '@patternfly/react-core'

export default function HeaderWithNotification(props: { messages: Message[] }) {
    const { t } = useTranslation(['search'])
    const { messages } = props

    return (
        <div style={{ outline: 'none', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ flex: 1 }}>
                <AcmPageHeader title={t('search')} />
            </div>

            {messages.map((msg, index) => {
                const displayShortText = t(`messages.${msg.id}.short`) || msg?.description
                const displayLongText = t(`messages.${msg.id}.long`) || msg?.description
                const footerText = t(`messages.${msg.id}.additional.info`)

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
                                        <a href='/search?filters={"textsearch":"kind%3Acluster%20addon%3Asearch-collector%3Dfalse%20name%3A!local-cluster"}'>
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
