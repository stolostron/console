/* Copyright Contributors to the Open Cluster Management project */
'use strict'

// Utility helpers for the topology view (string formatting, label wrapping, grouping, tooltips)

import R from 'ramda'
import _ from 'lodash'
import { Fragment } from 'react'
import ReactDOMServer from 'react-dom/server'
import { NodeGroupsMap, TopologyNode, TooltipItem } from './types'

// Convert types to OpenShift/Kube display entities
export function kubeNaming(type?: string): string {
  if (type === undefined) {
    return ''
  }
  return (
    type.charAt(0).toUpperCase() +
    type
      .slice(1)
      .replace('stream', 'Stream')
      .replace('channel', 'Channel')
      .replace('source', 'Source')
      .replace('reSource', 'Resource')
      .replace('definition', 'Definition')
      .replace('config', 'Config')
      .replace('account', 'Account')
      .replace('controller', 'Controller')
  )
}

// Make a human-readable title with potential line breaks
export function titleBeautify(maxStringLength: number, resourceName: string): string {
  const regex = /[A-Z][a-z']+(?: [A-Z][a-z]+)*/g
  const wordsList = resourceName.match(regex)
  if (wordsList && Math.max(0, maxStringLength) / resourceName.length > 0) {
    for (let idx = wordsList.length - 1; idx > 0; idx--) {
      if (wordsList.slice(0, idx).join('').length <= maxStringLength) {
        wordsList.splice(idx, 0, '\n')
        return wordsList.join('')
      }
    }
    return resourceName
  } else {
    return resourceName
  }
}

// Wrap a label across lines to fit within width and number of rows
export const getWrappedNodeLabel = (label: string, width: number, rows = 3): string => {
  const ip = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.exec(label)
  if (ip) {
    label = label.substr(0, ip.index) + '\n' + ip[0]
  } else {
    if (label.length > width * rows) {
      if (rows === 2) {
        label = label.substr(0, width) + '..\n' + label.substr(-width)
      } else {
        label = splitLabel(label.substr(0, width * 2), width, rows - 1) + '..\n' + label.substr(-width)
      }
    } else {
      label = splitLabel(label, width, rows)
    }
  }
  return label
}

const splitLabel = (label: string, width: number, rows: number): string => {
  let line = ''
  const lines: string[] = []
  let parts: string[] = label.split(/([^A-Za-z0-9])+/)
  if (parts.length === 1 && label.length > width) {
    //split if length > width and no split separator in label
    const split = R.splitAt(width, label) as unknown as string[]
    parts = split
  }
  let remaining = label.length
  do {
    // add label part
    line += parts.shift() as string

    // add splitter, check if next item is a splitter, 1 char
    if (parts.length && parts[0].length === 1) {
      line += parts.shift()
    }

    // if next label part puts it over width split it
    if (parts.length) {
      if (line.length + parts[0].length > width) {
        remaining -= line.length
        if (remaining > width && rows === 2) {
          // if penultimate row do a hard break
          const split = parts[0]
          const idx = width - line.length
          line += split.substr(0, idx)
          parts[0] = split.substr(idx)
        }
        lines.push(line)
        line = ''
        rows -= 1
      }
    } else {
      // nothing left, push last line
      lines.push(line)
    }
  } while (parts.length)

  // pull last line in if too short
  if (lines.length > 1) {
    let lastLine = lines.pop() as string
    if (lastLine.length <= 2) {
      lastLine = (lines.pop() as string) + lastLine
    }
    lines.push(lastLine)
  }
  return lines.join('\n')
}

// Simple string hash for consistent coloring or ids
export const getHashCode = (str: string): number => {
  let hash = 0
  let i: number
  let chr: number
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}

// Capitalize and humanize a resource type
export const getType = (type: string): string => {
  return _.capitalize(_.startCase(type))
}

// Derive node groups by type and augment node layout labels
export function getTypeNodeGroups(nodes: TopologyNode[]): {
  nodeGroups: NodeGroupsMap
  allNodeMap: Record<string, TopologyNode>
} {
  const groupMap: NodeGroupsMap = {}
  const allNodeMap: Record<string, TopologyNode> = {}
  nodes.forEach((node) => {
    allNodeMap[node.uid] = node
    const type = node.type

    let group = groupMap[type]
    if (!group) {
      group = groupMap[type] = { nodes: [] }
    }

    const label = getNodeLabel(node)
    node.layout = Object.assign(node.layout || {}, {
      uid: node.uid,
      type: node.type,
      label: getWrappedNodeLabel(label, 12, 3),
      compactLabel: getWrappedNodeLabel(label, 10, 2),
    })

    delete node.layout.source
    delete node.layout.target
    delete node.layout.nodeIcons
    delete node.layout.selfLink
    if ((node as any).selfLink) {
      ;(node.layout as any).selfLink = {
        link: (node as any).selfLink,
        nodeLayout: node.layout,
      }
    }

    group.nodes.push(node)
  })

  return { nodeGroups: groupMap, allNodeMap }
}

const getNodeLabel = (node: TopologyNode): string => {
  let label = getType(node.type)

  if (label === 'Cluster') {
    const nbOfClusters = _.get(node, 'specs.clusterNames', []).length
    if (nbOfClusters > 1) {
      label = `${nbOfClusters} Clusters`
    }
  }

  return label
}

// As scale decreases from max to min, return a counter zoomed value from min to max
export const counterZoom = (
  scale: number,
  scaleMin: number,
  scaleMax: number,
  valueMin: number,
  valueMax: number
): number => {
  if (scale >= scaleMax) {
    return valueMin
  } else if (scale <= scaleMin) {
    return valueMax
  }
  return valueMin + (1 - (scale - scaleMin) / (scaleMax - scaleMin)) * (valueMax - valueMin)
}

// Render a list of tooltip rows to static HTML for SVG annotations
export const getTooltip = (tooltips: TooltipItem[]): string => {
  return ReactDOMServer.renderToStaticMarkup(
    <Fragment>
      {tooltips.map(({ name, value, href, target = '_blank', rel = 'noopener noreferrer' }) => {
        return (
          <div key={String(name) + String(value)}>
            {name && name.length > 0 ? <span className="label">{name}: </span> : <span>&nbsp;</span>}
            {href ? (
              <a className="link" href={href} target={target} rel={rel}>
                {String(value)}
              </a>
            ) : (
              <span className="value">{String(value)}</span>
            )}
          </div>
        )
      })}
    </Fragment>
  )
}
