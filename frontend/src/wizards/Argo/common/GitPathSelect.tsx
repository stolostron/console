/* Copyright Contributors to the Open Cluster Management project */

import { ItemContext, useData, useItem, WizAsyncSelect } from '@patternfly-labs/react-form-wizard'
import { useCallback, useContext } from 'react'
import set from 'set-value'
import { useTranslation } from '../../../lib/acm-i18next'
import { Channel, getGitPathList } from '../ArgoWizard'
import { getGitChannelPaths } from '../../../resources'
import { usePrevious } from '../../../components/usePrevious'

type GitPathSelectProps = {
  channels: Channel[]
}

export const GitPathSelect = ({ channels }: GitPathSelectProps) => {
  const { t } = useTranslation()
  const repoURL = useItem('repoURL')
  const revision = useItem('targetRevision')
  const path = useItem('path')
  const item = useContext(ItemContext)
  const { update } = useData()

  const previousRepoURL = usePrevious(repoURL)
  const previousRevision = usePrevious(revision)

  const gitPathsAsyncCallback = useCallback(() => {
    const channel = channels?.find((channel) => channel?.spec?.pathname === repoURL)
    return getGitPathList(
      {
        metadata: {
          name: channel?.metadata?.name ?? '',
          namespace: channel?.metadata?.namespace ?? '',
        },
        spec: {
          pathname: channel?.spec.pathname ?? repoURL ?? '',
          type: 'git',
        },
      },
      revision,
      getGitChannelPaths,
      repoURL
    )
  }, [channels, repoURL, revision])

  // Clear path when repoURL or revision changes (update during render)
  const repoChanged = previousRepoURL !== repoURL && previousRepoURL !== undefined
  const revisionChanged = previousRevision !== revision && previousRevision !== undefined

  if ((repoChanged || revisionChanged) && path) {
    set(item, 'path', undefined, { preservePaths: false })
    update()
  }

  return (
    <WizAsyncSelect
      path="path"
      label={t('Path')}
      labelHelp={t('The location of the resources on the Git repository.')}
      placeholder={t('Enter or select a repository path')}
      isCreatable
      asyncCallback={gitPathsAsyncCallback}
    />
  )
}
