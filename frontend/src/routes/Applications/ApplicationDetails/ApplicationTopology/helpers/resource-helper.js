/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import queryString from 'query-string'

export const getEditLink = ({ name, namespace, kind, apiVersion, cluster }, hubClusterName) => {
  const cls = cluster ? cluster : hubClusterName
  return `/multicloud/search/resources/yaml?${queryString.stringify({
    cluster: cls,
    name,
    namespace,
    kind,
    apiversion: apiVersion,
  })}`
}
