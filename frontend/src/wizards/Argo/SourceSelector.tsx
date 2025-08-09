/* Copyright Contributors to the Open Cluster Management project */

import { ItemContext, Tile, useItem, WizHidden, WizTextInput, WizTiles } from '@patternfly-labs/react-form-wizard'
import { GitAltIcon } from '@patternfly/react-icons'
import { Fragment } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { ApplicationSet } from '../../resources'
import { Channel } from './ArgoWizard'
import { RepoURL } from './common'
import { GitPathSelect } from './common/GitPathSelect'
import { GitRevisionSelect } from './common/GitRevisionSelect'
import HelmIcon from './logos/HelmIcon.svg'

export function repositoryTypeToSource(value: unknown) {
  if (value === 'Git') {
    return {
      repoURL: '',
      targetRevision: '',
      path: '',
    }
  }
  if (value === 'Helm') {
    return {
      repoURL: '',
      chart: '',
      targetRevision: '',
    }
  }
  return value
}

export function sourceToRepositoryType(source: unknown) {
  if (typeof source === 'object' && source !== null) {
    const isGit = 'repoURL' in source && 'path' in source && 'targetRevision' in source
    if (isGit) return 'Git'

    const isHelm = 'repoURL' in source && 'chart' in source && 'targetRevision' in source
    if (isHelm) return 'Helm'
  }

  return undefined
}

export interface SourceSelectorProps {
  gitChannels: string[]
  channels: Channel[] | undefined
  helmChannels: string[]
}

export function SourceSelector(props: SourceSelectorProps) {
  const { gitChannels, helmChannels, channels } = props
  const data = useItem<ApplicationSet>()
  const { t } = useTranslation()
  return (
    <Fragment>
      <WizTiles
        path="spec.template.spec.source"
        label={t('Repository type')}
        inputValueToPathValue={repositoryTypeToSource}
        pathValueToInputValue={sourceToRepositoryType}
        onValueChange={(_, item: ApplicationSet) => {
          if (item.spec.template?.spec) {
            item.spec.template.spec.syncPolicy = {
              automated: {
                selfHeal: true,
                prune: true,
              },
              syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
            }
          }
        }}
      >
        <Tile id="git" value="Git" label={t('Git')} icon={<GitAltIcon />} description={t('Use a Git repository')} />
        <Tile id="helm" value="Helm" label={t('Helm')} icon={<HelmIcon />} description={t('Use a Helm repository')} />
      </WizTiles>
      {/* Git repo */}
      <ItemContext.Provider value={data.spec?.template?.spec?.source}>
        <WizHidden hidden={(data) => data.path === undefined}>
          <RepoURL name="git" channels={gitChannels} />
          <WizHidden hidden={(data) => data.repoURL === ''}>
            <GitRevisionSelect channels={channels ?? []} />
            <GitPathSelect channels={channels ?? []} />
          </WizHidden>
        </WizHidden>
        {/* Helm repo */}
        <WizHidden hidden={(data) => data.chart === undefined}>
          <RepoURL name="helm" channels={helmChannels} />
          <WizTextInput
            path="chart"
            label={t('Chart name')}
            placeholder={t('Enter the name of the Helm chart')}
            labelHelp={t('The specific name for the target Helm chart.')}
            required
          />
          <WizTextInput
            path="targetRevision"
            label={t('Package version')}
            placeholder={t('Enter the version or versions')}
            labelHelp={t(
              'The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0.'
            )}
            required
          />
        </WizHidden>
      </ItemContext.Provider>
    </Fragment>
  )
}
