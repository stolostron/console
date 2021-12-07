/* Copyright Contributors to the Open Cluster Management project */
import { Alert, Label } from '@patternfly/react-core'
import { BellIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from 'react-i18next'

export function TechPreviewAlert(props: { i18nKey: string; docHref: string }) {
    return (
        <Alert
            style={{ marginBottom: '16px' }}
            customIcon={<BellIcon />}
            isInline
            variant="warning"
            title={
                <Trans
                    i18nKey={props.i18nKey}
                    components={{
                        bold: <strong />,
                        a: (
                            <a
                                href={props.docHref}
                                target="_blank"
                                rel="noreferrer"
                                style={{ textDecoration: 'underline', color: 'inherit' }}
                            >
                                {}
                            </a>
                        ),
                    }}
                />
            }
        />
    )
}

export function DevPreviewLabel() {
    const { t } = useTranslation()
    return <Label color="orange">{t('cluster.create.developer.preview')}</Label>
}
