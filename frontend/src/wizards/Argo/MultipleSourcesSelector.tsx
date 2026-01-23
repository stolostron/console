/* Copyright Contributors to the Open Cluster Management project */

import {
  EditMode,
  Tile,
  WizArrayInput,
  WizHidden,
  WizTextDetail,
  WizTextInput,
  WizTiles,
  useEditMode,
} from '@patternfly-labs/react-form-wizard'
import { Label, Title } from '@patternfly/react-core'
import { GitAltIcon } from '@patternfly/react-icons'
import { Fragment } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { Channel } from './ArgoWizard'
import { RepoURL } from './common'
import { GitPathSelect } from './common/GitPathSelect'
import { GitRevisionSelect } from './common/GitRevisionSelect'
import HelmIcon from './logos/HelmIcon.svg'
import { isEmpty } from 'lodash'

export interface MultipleSourcesSelectorProps {
  channels: Channel[] | undefined
  gitChannels: string[]
  helmChannels: string[]
}

export function MultipleSourcesSelector(props: MultipleSourcesSelectorProps) {
  const { gitChannels, helmChannels, channels } = props
  const editMode = useEditMode()
  const { t } = useTranslation()
  return (
    <WizArrayInput
      path="spec.template.spec.sources"
      placeholder="Add another repository"
      disallowEmpty={editMode === EditMode.Create}
      required
      validation={(value) => {
        // standard required validation is not compatible with disallowEmpty
        return !value || (Array.isArray(value) && (value.length === 0 || (value.length === 1 && isEmpty(value[0]))))
          ? t('Required')
          : undefined
      }}
      collapsedContent={
        <Fragment>
          <WizHidden hidden={(data) => !data.repositoryType}>
            <Title headingLevel="h6">{t('Type')}</Title>
          </WizHidden>

          <WizHidden hidden={(data) => data.repositoryType !== 'git'}>
            <Label style={{ marginRight: 10 }} color="grey">
              {t('Got')}
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
      <WizTiles path="repositoryType" required>
        <Tile id="git" value="git" label="Git" icon={<GitAltIcon />} description={t('Use a Git repository')} />
        <Tile id="helm" value="helm" label="Helm" icon={<HelmIcon />} description={t('Use a Helm repository')} />
      </WizTiles>
      <WizHidden hidden={(data) => data.repositoryType !== 'git'}>
        {/* git repository */}
        <RepoURL name="git" channels={gitChannels} />
        <GitRevisionSelect channels={channels ?? []} />
        <GitPathSelect channels={channels ?? []} />
      </WizHidden>

      {/* helm repository */}
      <WizHidden hidden={(data) => data.repositoryType !== 'helm'}>
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
    </WizArrayInput>
  )
}
