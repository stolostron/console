/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { ResourceIcon, ResourceLink } from '@openshift-console/dynamic-plugin-sdk'
import { FleetResourceLinkProps } from '../types/fleet'
import classNames from 'classnames'
import { Link } from 'react-router-dom-v5-compat'
import { getURLSearchParam } from './utils/searchPaths'

export const FleetResourceLink: React.FC<FleetResourceLinkProps> = ({ cluster, ...resourceLinkProps }) => {
  if (cluster) {
    const {
      className,
      displayName,
      inline = false,
      groupVersionKind,
      name,
      nameSuffix,
      namespace,
      hideIcon,
      title,
      children,
      dataTest,
      onClick,
      truncate,
    } = resourceLinkProps

    const value = displayName ? displayName : name
    const classes = classNames('co-resource-item', className || '', {
      'co-resource-item--inline': inline,
      'co-resource-item--truncate': truncate,
    })

    const path =
      groupVersionKind?.kind === 'VirtualMachine' && namespace
        ? `/k8s/cluster/${cluster}/ns/${namespace}/kubevirt.io~v1~VirtualMachine/${name}`
        : `/multicloud/search/resources${getURLSearchParam({
            cluster,
            kind: groupVersionKind?.kind,
            apigroup: groupVersionKind?.group,
            apiversion: groupVersionKind?.version,
            name,
            namespace,
          })}`

    return (
      <span className={classes}>
        {!hideIcon && <ResourceIcon groupVersionKind={groupVersionKind} />}
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
  } else {
    return <ResourceLink {...resourceLinkProps} />
  }
}
