/* Copyright Contributors to the Open Cluster Management project */

import {
    Divider,
    Split,
    SplitItem,
    Stack,
    StackItem
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import React from 'react'
import { CHANNEL_TYPES, getResourceLabel, groupByRepoType } from '../helpers/resource-helper'
import LabelWithPopover from './LabelWithPopover'
import { useTranslation } from 'react-i18next'
import '../css/ResourceLabels.css'

function repoSort (appRepos: any) {
  return _.sortBy(appRepos, ['pathName', 'gitBranch', 'gitPath'])
}
export function ResourceLabels (props: {appRepos: any[], showSubscriptionAttributes: boolean,  isArgoApp: boolean}) {
    const { t } = useTranslation(['application'])
    const repoMap = groupByRepoType(props.appRepos || [])
    
    return (
        <div className="label-with-popover-container channel-labels">
            {CHANNEL_TYPES.filter(type => repoMap[type]).map(type => {
                const labelContent = getResourceLabel(
                  type,
                  repoMap[type].length,
                )
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
                            const link =
                                type === 'namespace'
                                    ? ''
                                    : pathName
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
                                    repoTypeAttributes = [
                                      'package',
                                      'packageFilterVersion'
                                    ]
                                  }
                                } else if (type === 'objectbucket') {
                                  repoTypeAttributes = ['bucketPath']
                                }
                            }
                            return (
                                <React.Fragment
                                    key={`${type}-${repo.pathname}-${repo.gitBranch}-${
                                      repo.gitPath
                                    }`}
                                >
                                    {index > 0 && (
                                        <StackItem>
                                            <Divider />
                                        </StackItem>
                                    )}
                                    <StackItem className="channel-entry">
                                        <Stack>
                                            <StackItem className="channel-entry-link">
                                              <a href={link} target="_blank" rel="noreferrer">
                                                  {pathName}
                                                  <ExternalLinkAltIcon />
                                              </a>
                                            </StackItem>
                                            {repoTypeAttributes.length > 0 && (
                                                <React.Fragment>
                                                    {repoTypeAttributes.map((attrib: any) => {
                                                        return (
                                                          <StackItem
                                                            key={attrib}
                                                            className="channel-entry-attribute"
                                                          >
                                                            <Split hasGutter>
                                                              <SplitItem className="channel-entry-attribute-name">
                                                                {t(`repo.type.label.${attrib}`)}:
                                                              </SplitItem>
                                                              <SplitItem>
                                                                {repo[attrib]
                                                                  ? repo[attrib]
                                                                  : t(
                                                                    'repo.type.label.noData',
                                                                  )}
                                                              </SplitItem>
                                                            </Split>
                                                          </StackItem>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )}
                                        </Stack>
                                    </StackItem>
                                </React.Fragment>
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