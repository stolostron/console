/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Tile,
  WizArrayInput,
  WizAsyncSelect,
  WizHidden,
  WizTextDetail,
  WizTextInput,
  WizTiles,
  useEditMode,
} from '@patternfly-labs/react-form-wizard'
import { Label, Title } from '@patternfly/react-core'
import { Dispatch, Fragment, SetStateAction } from 'react'
import { TFunction } from 'react-i18next'
import { GitAltIcon } from '@patternfly/react-icons'
import HelmIcon from './logos/HelmIcon.svg'
import { Channel, getGitBranchList, getGitPathList } from './ArgoWizard'
import { GitURLPath, HelmURLPath } from './common'

export interface MultipleSourcesSelectorProps {
  channels: Channel[] | undefined
  createdChannels: string[]
  getGitRevisions: (
    channelPath: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  gitChannels: string[]
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
  gitRevisionsAsyncCallback: (() => Promise<string[]>) | undefined
  helmChannels: string[]
  setCreatedChannels: Dispatch<SetStateAction<string[]>>
  gitPathsAsyncCallback: (() => Promise<string[]>) | undefined
  setGitPathsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  setGitRevisionsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  t: TFunction
}

function combineArraysPromise(promise1: Promise<any[]>, promise2: Promise<any[]>): Promise<any[]> {
  return Promise.all([promise1, promise2]).then(([result1, result2]) => [...result1, ...result2])
}

export function MultipleSourcesSelector(props: MultipleSourcesSelectorProps) {
  const {
    t,
    createdChannels,
    getGitRevisions,
    gitChannels,
    getGitPaths,
    gitRevisionsAsyncCallback,
    helmChannels,
    channels,
    setCreatedChannels,
    gitPathsAsyncCallback,
    setGitPathsAsyncCallback,
    setGitRevisionsAsyncCallback,
  } = props
  const editMode = useEditMode()
  return (
    <WizArrayInput
      path="spec.template.spec.sources"
      placeholder="Add another repository"
      disallowEmpty={editMode === EditMode.Create}
      collapsedContent={
        <Fragment>
          <WizHidden hidden={(data) => !data.repositoryType}>
            <Title headingLevel="h6">{t('Type')}</Title>
          </WizHidden>

          <WizHidden hidden={(data) => data.repositoryType !== 'git'}>
            <Label style={{ marginRight: 10 }} color="grey">
              {t('Git')}
            </Label>
          </WizHidden>
          <WizHidden hidden={(data) => data.repositoryType !== 'helm'}>
            <Label style={{ marginRight: 10 }} color="grey">
              {t('Helm')}
            </Label>
          </WizHidden>
          <WizTextDetail path="repoURL" placeholder={t('Expand to enter the repository details')} />
        </Fragment>
      }
    >
      <WizHidden hidden={(data) => data.repositoryType}>
        <Title headingLevel="h6">{t('Repository type')}</Title>
      </WizHidden>
      <WizTiles path="repositoryType">
        <Tile id="git" value="git" label="Git" icon={<GitAltIcon />} description={t('Use a Git repository')} />
        <Tile id="helm" value="helm" label="Helm" icon={<HelmIcon />} description={t('Use a Helm repository')} />
      </WizTiles>
      <WizHidden
        hidden={
          editMode === EditMode.Create ? (data) => data.repositoryType !== 'git' : (data) => data.path === undefined
        }
      >
        {/* git repository */}
        <GitURLPath
          t={t}
          channels={channels}
          getGitRevisions={getGitRevisions}
          gitChannels={gitChannels}
          path={'repoURL'}
          setCreatedChannels={setCreatedChannels}
          setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
        />
        <WizAsyncSelect
          path="targetRevision"
          label={t('Revision')}
          labelHelp={t('Refer to a single commit')}
          placeholder={t('Enter or select a tracking revision')}
          asyncCallback={
            editMode === EditMode.Create
              ? gitRevisionsAsyncCallback
              : () =>
                  combineArraysPromise(
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: '', type: 'git' },
                      },
                      getGitRevisions
                    ),
                    getGitBranchList(
                      {
                        metadata: { name: '', namespace: '' },
                        spec: { pathname: '', type: 'git' },
                      },
                      getGitRevisions
                    )
                  )
          }
          isCreatable
          onValueChange={(value, item) => {
            // set targetRevision on value change
            setGitRevisionsAsyncCallback(
              () => () =>
                getGitBranchList(
                  {
                    metadata: { name: '', namespace: '' },
                    spec: { pathname: item.repoURL, type: 'git' },
                  },
                  getGitRevisions
                )
            )

            // set path
            const channel = channels?.find((channel) => channel?.spec?.pathname === item.repoURL)
            const path = createdChannels.find((channel) => channel === item.repoURL)
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
                  item.repoURL
                )
            )
          }}
        />
        <WizAsyncSelect
          path="path"
          label={t('Path')}
          labelHelp={t('The location of the resources on the Git repository.')}
          placeholder={t('Enter or select a repository path')}
          isCreatable
          asyncCallback={gitPathsAsyncCallback}
        />
      </WizHidden>

      {/* helm repository */}
      <WizHidden
        hidden={
          editMode === EditMode.Create ? (data) => data.repositoryType !== 'helm' : (data) => data.chart === undefined
        }
      >
        <HelmURLPath
          getGitRevisions={getGitRevisions}
          helmChannels={helmChannels}
          path={'repoURL'}
          setCreatedChannels={setCreatedChannels}
          setGitRevisionsAsyncCallback={setGitRevisionsAsyncCallback}
          t={t}
        />
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
    </WizArrayInput>
  )
}
