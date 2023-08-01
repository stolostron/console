/* Copyright Contributors to the Open Cluster Management project */

import { Select } from '@patternfly-labs/react-form-wizard'
import { TFunction } from 'react-i18next'
import { Channel, getGitBranchList } from '../ArgoWizard'
import { Dispatch, SetStateAction } from 'react'
import { validateWebURL } from '../../../lib/validation'

export interface GitURLPathProps {
  path: string
  channels: Channel[] | undefined
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
  setCreatedChannels: Dispatch<SetStateAction<string[]>>
  setGitRevisionsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  t: TFunction
}

export function GitURLPath(props: GitURLPathProps) {
  const { t, channels, getGitRevisions, gitChannels, path, setCreatedChannels, setGitRevisionsAsyncCallback } = props
  return (
    <Select
      path={path}
      label={t('URL')}
      labelHelp={t('The URL path for the Git repository.')}
      placeholder={t('Enter or select a Git URL')}
      options={gitChannels}
      onValueChange={(value) => {
        const channel = channels?.find((channel) => channel.spec.pathname === value)
        setGitRevisionsAsyncCallback(
          () => () =>
            getGitBranchList(
              {
                metadata: {
                  name: channel?.metadata?.name,
                  namespace: channel?.metadata?.namespace,
                },
                spec: { pathname: value as string, type: 'git' },
              },
              getGitRevisions
            )
        )
      }}
      validation={validateWebURL}
      required
      isCreatable
      onCreate={(value: string) =>
        setCreatedChannels((channels) => {
          if (!channels.includes(value)) {
            channels.push(value)
          }
          setGitRevisionsAsyncCallback(
            () => () =>
              getGitBranchList(
                {
                  metadata: { name: '', namespace: '' },
                  spec: { pathname: value, type: 'git' },
                },
                getGitRevisions
              )
          )
          return [...channels]
        })
      }
    />
  )
}

export function HelmURLPath(props: {
  getGitRevisions: (
    channelPath: string,
    secretArgs?:
      | {
          secretRef?: string
          namespace?: string
        }
      | undefined
  ) => Promise<unknown>
  helmChannels: string[]
  path: string
  setCreatedChannels: Dispatch<SetStateAction<string[]>>
  setGitRevisionsAsyncCallback: Dispatch<SetStateAction<(() => Promise<string[]>) | undefined>>
  t: TFunction
}) {
  const { getGitRevisions, helmChannels, path, setCreatedChannels, setGitRevisionsAsyncCallback, t } = props
  return (
    <Select
      path={path}
      label={t('URL')}
      labelHelp={t('The URL path for the Helm repository.')}
      placeholder={t('Enter or select a Helm URL')}
      options={helmChannels}
      required
      isCreatable
      validation={validateWebURL}
      onCreate={(value: string) =>
        setCreatedChannels((channels) => {
          if (!channels.includes(value)) {
            channels.push(value)
          }
          setGitRevisionsAsyncCallback(
            () => () =>
              getGitBranchList(
                {
                  metadata: { name: '', namespace: '' },
                  spec: { pathname: value, type: 'git' },
                },
                getGitRevisions
              )
          )
          return [...channels]
        })
      }
    />
  )
}
