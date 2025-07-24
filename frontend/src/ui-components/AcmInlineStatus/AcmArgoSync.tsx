/* Copyright Contributors to the Open Cluster Management project */

import { Button, Icon, Label } from '@patternfly/react-core'
import { SyncAltIcon } from '@patternfly/react-icons'
import { useContext, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { Application, IResource } from '../../resources'
import { getResource, replaceResource } from '../../resources/utils'
import { AcmToastContext } from '../AcmAlert'

const refreshAppK8s = async (application: any) => {
  const latestApps = await Promise.all(
    (application.appSetApps ?? []).map(async (app: IResource) => {
      try {
        const latestApp = await getResource({
          apiVersion: app.apiVersion,
          kind: app.kind,
          metadata: {
            name: app.metadata?.name,
            namespace: app.metadata?.namespace,
          },
        }).promise
        return latestApp
      } catch (error) {
        console.warn(`Failed to fetch latest version of ${app.metadata?.name}:`, error)
        return app
      }
    })
  )

  return Promise.all(
    latestApps.map(
      (app: IResource) =>
        replaceResource({
          ...app,
          operation: {
            info: [
              {
                name: 'Reason',
                value: 'Initiated by user in openshift console',
              },
            ],
            initiatedBy: {
              automated: false,
              username: 'OpenShift-Console',
            },
            sync: {
              ...(app as any).spec?.syncPolicy,
            },
          },
        }).promise
    )
  )
}

type AcmArgoRefreshProps = {
  readonly app: Application
}

export function AcmArgoSync({ app }: AcmArgoRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { addAlert } = useContext(AcmToastContext)

  const { t } = useTranslation()
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAppK8s(app)
      addAlert({
        title: t('ArgoCD app synced'),
        message: t('{{name}} was successfully synced.', { name: app.metadata?.name }),
        type: 'success',
        autoClose: true,
      })
    } catch (error) {
      console.error('Failed to refresh ArgoCD app:', error)
      addAlert({
        title: t('Sync failed'),
        message: t('Failed to sync {{name}}. Please try again.', { name: app.metadata?.name }),
        type: 'danger',
      })
    } finally {
      setIsRefreshing(false)
    }
  }
  return (
    <Button variant="plain" onClick={handleRefresh}>
      <Label
        icon={
          <Icon color="grey" isInProgress={isRefreshing}>
            <SyncAltIcon />
          </Icon>
        }
        aria-label={t('Sync')}
      />
    </Button>
  )
}
