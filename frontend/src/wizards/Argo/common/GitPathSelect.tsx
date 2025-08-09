/* Copyright Contributors to the Open Cluster Management project */

import { useItem, WizAsyncSelect } from '@patternfly-labs/react-form-wizard'
import { useCallback } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Channel, getGitPathList } from '../ArgoWizard'
import { getGitChannelPaths } from '../../../resources'

type GitPathSelectProps = {
  channels: Channel[]
}

export const GitPathSelect = ({ channels }: GitPathSelectProps) => {
  const { t } = useTranslation()
  const repoURL = useItem('repoURL')
  const revision = useItem('targetRevision')

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
