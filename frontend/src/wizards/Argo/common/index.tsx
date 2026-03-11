/* Copyright Contributors to the Open Cluster Management project */

import { WizSelect } from '@patternfly-labs/react-form-wizard'
import { useTranslation } from '../../../lib/acm-i18next'
import { Secret } from '../../../resources'
import { useValidation } from '../../../hooks/useValidation'

export interface GitURLPathProps {
  name: string
  channels: string[]
  secrets: Secret[]
}

export function RepoURL({ name, channels, secrets }: GitURLPathProps) {
  const { t } = useTranslation()

  const secretURLs: string[] = []
  secrets?.forEach((secret) => {
    if (secret.metadata.labels?.['argocd.argoproj.io/secret-type'] === 'repository') {
      const repoType = Buffer.from(secret.data?.type ?? '', 'base64').toString()
      if (repoType === name) {
        const url = Buffer.from(secret.data?.url ?? '', 'base64').toString()
        if (url) {
          secretURLs.push(url)
        }
      }
    }
  })

  const allChannels = [...new Set([...channels, ...secretURLs])]

  const { validateWebURL } = useValidation()
  return (
    <WizSelect
      path="repoURL"
      label={t('URL')}
      labelHelp={
        name === 'git' ? t('The URL path for the Git repository.') : t('The URL path for the Helm repository.')
      }
      placeholder={name === 'git' ? t('Enter or select a Git URL') : t('Enter or select a Helm URL')}
      options={allChannels}
      validation={validateWebURL}
      required
      isCreatable
    />
  )
}
