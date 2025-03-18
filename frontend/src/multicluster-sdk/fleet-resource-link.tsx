/* Copyright Contributors to the Open Cluster Management project */
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk'
import { NavigationPath } from '../NavigationPath'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import classNames from 'classnames'
import { GetUrlSearchParam } from '../routes/Search/searchDefinitions'
import { FC } from 'react'
import { FleetResourceLinkProps } from '@stolostron/multicluster-sdk'

export const FleetResourceLink: FC<FleetResourceLinkProps> = (props) => {
  const {
    cluster,
    className,
    displayName,
    inline = false,
    kind,
    groupVersionKind,
    linkTo = true,
    name,
    nameSuffix,
    namespace,
    hideIcon,
    title,
    children,
    dataTest,
    onClick,
    truncate,
  } = props

  if (!kind && !groupVersionKind) {
    return null
  }

  let apigroup, apiversion, apikind
  if (groupVersionKind) {
    ;({ group: apigroup, version: apiversion, kind: apikind } = groupVersionKind)
  } else if (kind) {
    const parts = kind.split('~')
    apikind = parts.pop()
    apiversion = parts.pop() ?? 'v1'
    apigroup = parts.pop() ?? ''
    if (apigroup === 'core') {
      apigroup = ''
    }
  }
  let path = undefined
  if (linkTo) {
    if (apigroup === 'cluster.open-cluster-management.io' && apikind === 'ManagedCluster') {
      path = generatePath(NavigationPath.clusterDetails, { namespace: name ?? null, name: name ?? null })
    } else {
      path = `${NavigationPath.resources}${GetUrlSearchParam({
        cluster,
        kind: apikind,
        apigroup,
        apiversion,
        name,
        namespace,
      })}`
    }
  }

  const value = displayName ? displayName : name
  const classes = classNames('co-resource-item', className, {
    'co-resource-item--inline': inline,
    'co-resource-item--truncate': truncate,
  })

  return (
    <span className={classes}>
      {!hideIcon && <ResourceIcon kind={kind} groupVersionKind={groupVersionKind} />}
      {path ? (
        <Link
          to={path}
          title={title}
          className="co-resource-item__resource-name"
          data-test-id={value}
          data-test={dataTest ?? value}
          onClick={onClick}
        >
          {value}
          {nameSuffix}
        </Link>
      ) : (
        <span className="co-resource-item__resource-name" data-test-id={value} data-test={dataTest ?? value}>
          {value}
          {nameSuffix}
        </span>
      )}
      {children}
    </span>
  )
}
