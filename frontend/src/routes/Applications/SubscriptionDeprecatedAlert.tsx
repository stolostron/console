import { Alert } from "@patternfly/react-core"
import { useTranslation } from "react-i18next"

export default function SubscriptionDeprecatedAlert() {
  const { t } = useTranslation()
  return (
    <div style={{ marginTop: '1rem' }}>
      <Alert isInline variant="warning" title={t('Subscriptions Deprecated')}>
        {t('Subscriptions will expire soon. Consider migrating to application set.')}
      </Alert>
    </div>
  )
}