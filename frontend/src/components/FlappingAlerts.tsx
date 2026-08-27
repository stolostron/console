/* Copyright Contributors to the Open Cluster Management project */
import { useContext } from 'react'
import { Alert, AlertActionCloseButton, AlertGroup } from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'
import { PluginContext } from '../lib/PluginContext'

/**
 * Renders warnings for resources that are being throttled due to flapping (see backend/src/routes/events.ts).
 *
 * This must be rendered inside actual ACM/MCE routed page content (e.g. via LoadPluginData), not inside
 * PluginDataContextProvider/LoadData. That provider is registered as a global OpenShift Console
 * `console.context-provider` extension, so anything it renders directly would appear on every console page,
 * not just ACM/MCE pages.
 */
export function FlappingAlerts() {
  const { t } = useTranslation()
  const { dataContext } = useContext(PluginContext)
  const { flappingAlerts, setFlappingAlerts } = useContext(dataContext)

  if (flappingAlerts.length === 0) return null

  return (
    <AlertGroup isLiveRegion>
      {flappingAlerts.map((alert) => {
        const key = `${alert.kind}/${alert.namespace}/${alert.name}`
        return (
          <Alert
            key={key}
            variant="warning"
            title={t('Resource update throttled')}
            actionClose={
              <AlertActionCloseButton
                title={t('Close')}
                onClose={() => {
                  setFlappingAlerts((alerts) => alerts.filter((a) => `${a.kind}/${a.namespace}/${a.name}` !== key))
                }}
              />
            }
          >
            {t(
              '{{kind}} {{name}} in namespace {{namespace}} has been modified more than {{threshold}} times in the last {{windowMinutes}} minutes. Verify this resource is configured correctly. Updates are being limited to {{timesPerMinute}} times per minute.',
              {
                kind: alert.kind,
                name: alert.name,
                namespace: alert.namespace,
                threshold: alert.threshold,
                windowMinutes: Math.max(1, Math.round(alert.windowMs / 60_000)),
                timesPerMinute: Math.max(1, Math.round(60_000 / alert.cooldownMs)),
              }
            )}
          </Alert>
        )
      })}
    </AlertGroup>
  )
}
