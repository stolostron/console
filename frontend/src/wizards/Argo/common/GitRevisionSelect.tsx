/* Copyright Contributors to the Open Cluster Management project */

import { ItemContext, useData, useItem, WizAsyncSelect } from '@patternfly-labs/react-form-wizard'
import { useCallback, useContext } from 'react'
import set from 'set-value'
import { useTranslation } from '../../../lib/acm-i18next'
import { Channel, getGitBranchList } from '../ArgoWizard'
import { getGitChannelBranches } from '../../../resources'
import { usePrevious } from '../../../components/usePrevious'

type GitRevisionSelectProps = {
  target?: string
  path?: string
  revisions?: string[]
  channels: Channel[]
}

type WizardItem = Record<string, unknown>

export const GitRevisionSelect = ({ channels, path, target, revisions }: GitRevisionSelectProps) => {
  const { t } = useTranslation()
  const repoURL = useItem(path ?? 'repoURL')
  const targetRevision = useItem(target ?? 'targetRevision')
  const item = useContext(ItemContext)
  const { update } = useData()

  const previousRepoURL = usePrevious(repoURL)

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
    ).then((branches) => [...(revisions ?? []), ...branches])
  }, [channels, repoURL, revisions])

  // Clear targetRevision and path when repoURL changes (update during render)
  if (previousRepoURL !== repoURL && previousRepoURL !== undefined) {
    let needsUpdate = false

    if (targetRevision) {
      set(item, target ?? 'targetRevision', undefined, { preservePaths: false })
      needsUpdate = true
    }

    const currentPath = (item as WizardItem).path
    if (currentPath) {
      set(item, path ?? 'path', undefined, { preservePaths: false })
      needsUpdate = true
    }

    if (needsUpdate) {
      update()
    }
  }

  return (
    <WizAsyncSelect
      path={target ?? 'targetRevision'}
      label={t('Revision')}
      labelHelp={t('Refer to a single commit')}
      placeholder={t('Enter or select a tracking revision')}
      asyncCallback={gitRevisionsAsyncCallback}
      isCreatable
    />
  )
}
