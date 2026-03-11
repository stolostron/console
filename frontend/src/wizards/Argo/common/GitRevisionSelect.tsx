/* Copyright Contributors to the Open Cluster Management project */

import { ItemContext, useData, useItem, WizAsyncSelect } from '@patternfly-labs/react-form-wizard'
import { useCallback, useContext } from 'react'
import set from 'set-value'
import { useTranslation } from '../../../lib/acm-i18next'
import { Channel, getGitBranchList } from '../ArgoWizard'
import { getGitChannelBranches } from '../../../resources'
import { usePrevious } from '../../../components/usePrevious'
import { Secret } from '../../../resources'

type GitRevisionSelectProps = {
  target?: string
  path?: string
  revisions?: string[]
  channels: Channel[]
  secrets: Secret[]
}

type WizardItem = Record<string, unknown>

export const GitRevisionSelect = ({ channels, path, target, revisions, secrets }: GitRevisionSelectProps) => {
  const { t } = useTranslation()
  const repoURL = useItem(path ?? 'repoURL')
  const targetRevision = useItem(target ?? 'targetRevision')
  const item = useContext(ItemContext)
  const { update } = useData()

  const previousRepoURL = usePrevious(repoURL)

  const gitRevisionsAsyncCallback = useCallback(() => {
    const channel = channels?.find((channel) => channel.spec.pathname === repoURL)
    const secret = secrets?.find((secret) => {
      if (!repoURL) {
        return false
      }
      if (secret.metadata.labels?.['argocd.argoproj.io/secret-type'] === 'repository') {
        // strip .git from the end of the URL
        const newURL = repoURL.replace(/\.git$/, '')
        const secretURL = Buffer.from(secret.data?.url ?? '', 'base64')
          .toString()
          .replace(/\.git$/, '')
        return secretURL === newURL
      }
      return false
    })

    if (secret) {
      return getGitChannelBranches(
        repoURL,
        { secretRef: secret.metadata.name, namespace: secret.metadata.namespace },
        {
          user: Buffer.from(secret.data?.username ?? '', 'base64').toString(),
          accessToken: Buffer.from(secret.data?.password ?? '', 'base64').toString(),
        }
      ).then((branches) => [...(revisions ?? []), ...(branches ?? [])])
    } else {
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
    }
  }, [channels, repoURL, revisions, secrets])

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
