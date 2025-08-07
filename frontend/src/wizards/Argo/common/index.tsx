/* Copyright Contributors to the Open Cluster Management project */

import { WizSelect } from '@patternfly-labs/react-form-wizard'
import { useTranslation } from '../../../lib/acm-i18next'
import { validateWebURL } from '../../../lib/validation'

export interface GitURLPathProps {
  name: string
  channels: string[]
}

export function RepoURL({ name, channels }: GitURLPathProps) {
  const { t } = useTranslation()
  return (
    <WizSelect
      path="repoURL"
      label={t('URL')}
      labelHelp={
        name === 'git' ? t('The URL path for the Git repository.') : t('The URL path for the Helm repository.')
      }
      placeholder={name === 'git' ? t('Enter or select a Git URL') : t('Enter or select a Helm URL')}
      options={channels}
      validation={validateWebURL}
      required
      isCreatable
    />
  )
}
