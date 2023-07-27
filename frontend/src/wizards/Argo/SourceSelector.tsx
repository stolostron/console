/* Copyright Contributors to the Open Cluster Management project */

import { Tile, WizAsyncSelect, WizHidden, WizTextInput, WizTiles } from '@patternfly-labs/react-form-wizard'
import { Dispatch, Fragment, SetStateAction } from 'react'
import { ApplicationSet } from '../../resources'
import { GitAltIcon } from '@patternfly/react-icons'
import HelmIcon from './logos/HelmIcon.svg'
import { Channel, getGitPathList } from './ArgoWizard'
import { TFunction } from 'react-i18next'
import { GitURLPath, HelmURLPath } from './common'

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

function sourceToRepositoryType(source: unknown) {
  if (typeof source === 'object' && source !== null) {
    const isGit = 'repoURL' in source && 'path' in source && 'targetRevision' in source
    if (isGit) return 'Git'

    const isHelm = 'repoURL' in source && 'chart' in source && 'targetRevision' in source
    if (isHelm) return 'Helm'
  }

  return undefined
}

export interface SourceSelectorProps {
  t: TFunction
  gitChannels: string[]
  channels: Channel[] | undefined
  helmChannels: string[]
  getGitPaths: (
    channelPath: string,
    branch: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  gitPathsAsyncCallback: (() => Promise<string[]>) | undefined
  setGitPathsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  gitRevisionsAsyncCallback: (() => Promise<string[]>) | undefined
  setGitRevisionsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  getGitRevisions: (
    channelPath: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  createdChannels: string[]
  setCreatedChannels: Dispatch<SetStateAction<string[]>>
}

export function SourceSelector(props: SourceSelectorProps) {
  const {
    t,
    gitChannels,
    helmChannels,
    channels,
    getGitPaths,
    gitPathsAsyncCallback,
    gitRevisionsAsyncCallback,
    setGitRevisionsAsyncCallback,
    setGitPathsAsyncCallback,
    getGitRevisions,
    createdChannels,
    setCreatedChannels,
  } = props
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
      <WizHidden hidden={(data) => data.spec.template.spec.source.path === undefined}>
        <GitURLPath
          t={t}
          channels={channels}
          getGitRevisions={getGitRevisions}
          gitChannels={gitChannels}
          path={'spec.template.spec.source.repoURL'}
          setCreatedChannels={setCreatedChannels}
          setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
        />

        <WizHidden hidden={(data) => data.spec.template.spec.source.repoURL === ''}>
          <WizAsyncSelect
            path="spec.template.spec.source.targetRevision"
            label={t('Revision')}
            labelHelp={t('Refer to a single commit')}
            placeholder={t('Enter or select a tracking revision')}
            asyncCallback={gitRevisionsAsyncCallback}
            isCreatable
            onValueChange={(value, item) => {
              const channel = channels?.find(
                (channel) => channel?.spec?.pathname === item.spec.template.spec.source.repoURL
              )
              const path = createdChannels.find((channel) => channel === item.spec.template.spec.source.repoURL)
              setGitPathsAsyncCallback(
                () => () =>
                  getGitPathList(
                    {
                      metadata: {
                        name: channel?.metadata?.name ?? '',
                        namespace: channel?.metadata?.namespace ?? '',
                      },
                      spec: {
                        pathname: channel?.spec.pathname ?? path ?? '',
                        type: 'git',
                      },
                    },
                    value as string,
                    getGitPaths,
                    item.spec.template.spec.source.repoURL
                  )
              )
            }}
          />
          <WizAsyncSelect
            path="spec.template.spec.source.path"
            label={t('Path')}
            labelHelp={t('The location of the resources on the Git repository.')}
            placeholder={t('Enter or select a repository path')}
            isCreatable
            asyncCallback={gitPathsAsyncCallback}
          />
        </WizHidden>
      </WizHidden>
      {/* Helm repo */}
      <WizHidden hidden={(data) => data.spec.template.spec.source.chart === undefined}>
        <HelmURLPath
          getGitRevisions={getGitRevisions}
          helmChannels={helmChannels}
          path={'spec.template.spec.source.repoURL'}
          setCreatedChannels={setCreatedChannels}
          setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
          t={t}
        />
        <WizTextInput
          path="spec.template.spec.source.chart"
          label={t('Chart name')}
          placeholder={t('Enter the name of the Helm chart')}
          labelHelp={t('The specific name for the target Helm chart.')}
          required
        />
        <WizTextInput
          path="spec.template.spec.source.targetRevision"
          label={t('Package version')}
          placeholder={t('Enter the version or versions')}
          labelHelp={t(
            'The version or versions for the deployable. You can use a range of versions in the form >1.0, or <3.0.'
          )}
          required
        />
      </WizHidden>
    </Fragment>
  )
}
