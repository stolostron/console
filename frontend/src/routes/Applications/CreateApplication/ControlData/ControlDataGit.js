/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { VALIDATE_GITBRANCH, VALID_REPOPATH, VALIDATE_URL } from 'temptifly'
import {
//   loadExistingChannels,
  channelSimplified,
  updateChannelControls,
  updateGitBranchFolders
} from './utils'

const githubChannelData = [
  {
    id: 'channelNamespaceExists',
    type: 'hidden',
    active: true
  },
  {
    id: 'channelName',
    type: 'hidden',
    active: ''
  },
  {
    id: 'channelNamespace',
    type: 'hidden',
    active: ''
  },
  {
    name: 'creation.app.github.url',
    tooltip: 'tooltip.creation.app.github.url',
    id: 'githubURL',
    type: 'combobox',
    active: '',
    placeholder: 'app.enter.select.github.url',
    available: [],
    validation: VALIDATE_URL,
    // fetchAvailable: loadExistingChannels('git'),
    reverse: 'ApplicationSet[0].spec.template.spec.source.repoURL',
    onSelect: updateChannelControls,
    simplified: channelSimplified
  },
  ///////// revision type /////////
  {
    name: 'argo.git.revision.type.title',
    tooltip: 'argo.git.revision.type.tooltip',
    id: 'gitRevisionType',
    type: 'combobox',
    placeholder: 'argo.git.revision.type.placeholder',
    active: 'Branches',
    available: ['Branches', 'Tags'],
    validation: {
      required: true
    }
  },
  ///////// revision /////////
  {
    name: 'argo.git.target.revision',
    tooltip: 'argo.git.target.revision.tooltip',
    id: 'githubBranch',
    type: 'combobox',
    placeholder: 'argo.git.target.revision.placeholder',
    validation: VALIDATE_GITBRANCH,
    onSelect: updateGitBranchFolders,
    reverse: 'ApplicationSet[0].spec.template.spec.source.targetRevision'
  },
  {
    name: 'creation.app.github.path',
    tooltip: 'tooltip.creation.app.github.path',
    id: 'githubPath',
    type: 'combobox',
    active: '',
    placeholder: 'app.enter.select.path',
    available: [],
    validation: VALID_REPOPATH,
    reverse: 'ApplicationSet[0].spec.template.spec.source.path',
    cacheUserValueKey: 'create.app.github.path'
  }
]

export default githubChannelData
