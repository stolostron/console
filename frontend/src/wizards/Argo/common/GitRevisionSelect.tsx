import { useItem, WizAsyncSelect } from '@patternfly-labs/react-form-wizard'
import { useCallback } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { Channel, getGitBranchList } from '../ArgoWizard'
import { getGitChannelBranches } from '../../../resources'

type GitRevisionSelectProps = {
  channels: Channel[]
}

export const GitRevisionSelect = ({ channels }: GitRevisionSelectProps) => {
  const { t } = useTranslation()
  const repoURL = useItem('repoURL')

  const gitRevisionsAsyncCallback = useCallback(() => {
    const channel = channels?.find((channel) => channel.spec.pathname === repoURL)

    return getGitBranchList(
      {
        metadata: {
          name: channel?.metadata?.name ?? '',
          namespace: channel?.metadata?.namespace ?? '',
        },
        spec: { pathname: repoURL, type: 'git' },
      },
      getGitChannelBranches
    )
  }, [channels, repoURL])

  return (
    <WizAsyncSelect
      path="targetRevision"
      label={t('Revision')}
      labelHelp={t('Refer to a single commit')}
      placeholder={t('Enter or select a tracking revision')}
      asyncCallback={gitRevisionsAsyncCallback}
    />
  )
}
