/* Copyright Contributors to the Open Cluster Management project */

import { Button, Icon, Label } from '@patternfly/react-core'
import { SyncAltIcon } from '@patternfly/react-icons'
import { useContext, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { Application, IResource } from '../../resources'
import { replaceResource } from '../../resources/utils'
import { AcmToastContext } from '../AcmAlert'

const refreshAppK8s = async (application: any) =>
  Promise.all(
    (application.appSetApps ?? []).map(
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

type AmcArgoRefreshProps = {
  app: Application
}
export function AmcArgoRefresh({ app }: AmcArgoRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { addAlert } = useContext(AcmToastContext)

  const { t } = useTranslation()
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshAppK8s(app)
    setIsRefreshing(false)
    addAlert({
      title: t('ArgoCD app refreshed'),
      message: t('{{name}} was successfully refreshed.', { name: app.metadata?.name }),
      type: 'success',
      autoClose: true,
    })
  }
  return (
    <Button variant="plain" onClick={handleRefresh}>
      <Label
        icon={
          <Icon color="grey" isInProgress={isRefreshing}>
            <SyncAltIcon />
          </Icon>
        }
        aria-label={t('Refresh')}
      />
    </Button>
  )
}
