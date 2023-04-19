/* Copyright Contributors to the Open Cluster Management project */

import { Divider, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core'
import _ from 'lodash'

import { CHANNEL_TYPES, getResourceLabel, groupByRepoType } from '../helpers/resource-helper'
import LabelWithPopover from './LabelWithPopover'
import { TFunction } from 'i18next'
import '../css/ResourceLabels.css'
import { Fragment } from 'react'
import { AcmInlineCopy } from '../../../ui-components'

function repoSort(appRepos: any) {
  return _.sortBy(appRepos, ['pathName', 'gitBranch', 'gitPath'])
}

export function ResourceLabels(props: {
  appRepos: any[]
  showSubscriptionAttributes: boolean
  isArgoApp: boolean
  translation: TFunction
}) {
  const t = props.translation
  const repoMap = groupByRepoType(props.appRepos || [])

  function getRepoTypeLabel(attrib: String, t: (arg: String) => String) {
    switch (attrib) {
      case 'gitPath':
        return `${t('Path')}:`
      case 'gitBranch':
        return `${t('Branch')}:`
      case 'targetRevision':
        return `${t('Revision')}:`
      case 'chart':
        return `${t('Chart name')}:`
      case 'package':
        return `${t('Chart name')}:`
      case 'packageFilterVersion':
        return `${t('Package version')}:`
      case 'bucketPath':
        return `${t('Subfolder')}:`
      default:
        break
    }
  }

  return (
    <div className="label-with-popover-container channel-labels">
      {CHANNEL_TYPES.filter((type) => repoMap[type]).map((type) => {
        const labelContent = getResourceLabel(type, repoMap[type].length, t)
        return (
          <LabelWithPopover
            key={`${type}`}
            labelContent={labelContent}
            labelColor="grey"
            popoverHeader={repoMap[type].length > 1 ? labelContent : ''}
          >
            <Stack className="channel-labels channel-labels-popover-content">
              {repoSort(repoMap[type]).map((repo, index) => {
                const pathName = repo.pathName
                let repoTypeAttributes: any = []
                if (props.showSubscriptionAttributes) {
                  if (type === 'git') {
                    if (props.isArgoApp) {
                      repoTypeAttributes = ['gitPath', 'targetRevision']
                    } else {
                      repoTypeAttributes = ['gitBranch', 'gitPath']
                    }
                  } else if (type === 'helmrepo') {
                    if (props.isArgoApp) {
                      repoTypeAttributes = ['chart', 'targetRevision']
                    } else {
                      repoTypeAttributes = ['package', 'packageFilterVersion']
                    }
                  } else if (type === 'objectbucket') {
                    repoTypeAttributes = ['bucketPath']
                  }
                }
                return (
                  <Fragment key={`${type}-${repo.pathname}-${repo.gitBranch}-${repo.gitPath}`}>
                    {index > 0 && (
                      <StackItem>
                        <Divider />
                      </StackItem>
                    )}
                    <StackItem className="channel-entry">
                      <Stack>
                        <StackItem className="channel-entry-link">
                          <AcmInlineCopy text={pathName} id="pathName" />
                        </StackItem>
                        {repoTypeAttributes.length > 0 && (
                          <Fragment>
                            {repoTypeAttributes.map((attrib: any) => {
                              return (
                                <StackItem key={attrib} className="channel-entry-attribute">
                                  <Split hasGutter>
                                    <SplitItem className="channel-entry-attribute-name">
                                      {getRepoTypeLabel(attrib, t)}
                                    </SplitItem>
                                    <SplitItem>{repo[attrib] ? repo[attrib] : t('Not selected')}</SplitItem>
                                  </Split>
                                </StackItem>
                              )
                            })}
                          </Fragment>
                        )}
                      </Stack>
                    </StackItem>
                  </Fragment>
                )
              })}
            </Stack>
          </LabelWithPopover>
        )
      })}
    </div>
  )
}

export default ResourceLabels
