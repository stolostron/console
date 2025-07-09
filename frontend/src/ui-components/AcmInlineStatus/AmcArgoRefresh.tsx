/* Copyright Contributors to the Open Cluster Management project */

import { Button, Icon, Label } from '@patternfly/react-core'
import { SyncAltIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { IResource } from '../../resources'
import { replaceResource } from '../../resources/utils'

const refreshAppk8s = async (app: IResource): Promise<IResource<IResource>> =>
  replaceResource({
    ...app,
    metadata: {
      ...app.metadata,
      annotations: { ...app.metadata?.annotations, 'argocd.argoproj.io/refresh': 'refreshing' },
    },
  }).promise
type AmcArgoRefreshProps = {
  app: IResource
}
export function AmcArgoRefresh({ app }: AmcArgoRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { t } = useTranslation()
  const handleRefresh = () => {
    setIsRefreshing(true)
    refreshAppk8s(app).then(() => {
      setIsRefreshing(false)
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
