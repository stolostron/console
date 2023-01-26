/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.

 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import placementData from './ControlDataPlacement'

const otherChannelData = (isLocalCluster, t) => {
  return [
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  clusters  /////////////////////////////////////
    {
      id: 'channelNamespaceExists',
      type: 'hidden',
      active: true,
    },
    {
      id: 'channelName',
      type: 'hidden',
      active: '',
    },
    {
      id: 'channelNamespace',
      type: 'hidden',
      active: '',
    },
    {
      name: t('creation.app.namespace.name'),
      tooltip: t('tooltip.creation.app.namespace.name'),
      id: 'namespaceChannelName',
      type: 'text',
      active: '',
      placeholder: t('app.enter.select.namespace.name'),
      available: [],
      reverse: 'Channel[0].spec.pathname',
    },
    ...placementData(isLocalCluster, t),
  ]
}

export default otherChannelData
