/* Copyright Contributors to the Open Cluster Management project */
import R from 'ramda'
import _ from 'lodash'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

function attrsFunction(selection, map) {
    return selection.each(function (d, i, ns) {
        var x = map.apply(selection, arguments)
        for (var name in x) ns[i].setAttribute(name, x[name])
    })
}

function attrsObject(selection, map) {
    for (var name in map) selection.attr(name, map[name])
    return selection
}

export function attrs(selection, map, s) {
    return (typeof map === 'function' ? attrsFunction : attrsObject)(selection, map, s)
}

function stylesFunction(selection, map) {
    return selection.each(function (d, i, ns) {
        var x = map.apply(selection, arguments)
        for (var name in x) ns[i].style[name] = x[name]
    })
}

function stylesObject(selection, map, priority) {
    for (var name in map) selection.style(name, map[name], priority)
    return selection
}

export function styles(selection, map, priority) {
    return (typeof map === 'function' ? stylesFunction : stylesObject)(selection, map, priority == null ? '' : priority)
}

// Convert types to OpenShift/Kube entities
export function kubeNaming(type) {
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
            .replace('config', 'Config')
            .replace('account', 'Account')
            .replace('controller', 'Controller')
    )
}

// Make nice carriage return for long titles
export function titleBeautify(maxStringLength, resourceName) {
    const rx_regex = /[A-Z][a-z']+(?: [A-Z][a-z]+)*/g
    var wordsList = resourceName.match(rx_regex)
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

export const getWrappedNodeLabel = (label, width, rows = 3) => {
    // if too long, add elipse and split the rest
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

const splitLabel = (label, width, rows) => {
    let line = ''
    const lines = []
    let parts = label.split(/([^A-Za-z0-9])+/)
    if (parts.length === 1 && label.length > width) {
        //split if length > width and no split separator in label
        parts = R.splitAt(width, label)
    }
    let remaining = label.length
    do {
        // add label part
        line += parts.shift()

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
        let lastLine = lines.pop()
        if (lastLine.length <= 2) {
            lastLine = lines.pop() + lastLine
        }
        lines.push(lastLine)
    }
    return lines.join('\n')
}

export const getHashCode = (str) => {
    let hash = 0,
        i,
        chr
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i)
        hash = (hash << 5) - hash + chr
        hash |= 0
    }
    return hash
}

export const getType = (type) => {
    return _.capitalize(_.startCase(type))
}

const getNodeLabel = (node) => {
    let label = getType(node.type)

    if (label === 'Cluster') {
        const nbOfClusters = _.get(node, 'specs.clusterNames', []).length
        if (nbOfClusters > 1) {
            label = `${nbOfClusters} Clusters`
        }
    }

    return label
}

export function getTypeNodeGroups(nodes) {
    // separate into types
    const groupMap = {}
    const allNodeMap = {}
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
        if (node.selfLink) {
            node.layout.selfLink = {
                link: node.selfLink,
                nodeLayout: node.layout,
            }
        }

        group.nodes.push(node)
    })

    return { nodeGroups: groupMap, allNodeMap }
}

//as scale decreases from max to min, return a counter zoomed value from min to max
export const counterZoom = (scale, scaleMin, scaleMax, valueMin, valueMax) => {
    if (scale >= scaleMax) {
        return valueMin
    } else if (scale <= scaleMin) {
        return valueMax
    }
    return valueMin + (1 - (scale - scaleMin) / (scaleMax - scaleMin)) * (valueMax - valueMin)
}

export const getTooltip = (tooltips) => {
    return ReactDOMServer.renderToStaticMarkup(
        <React.Fragment>
            {tooltips.map(({ name, value, href, target = '_blank', rel = 'noopener noreferrer' }) => {
                return (
                    <div key={Math.random()}>
                        {name && name.length > 0 ? <span className="label">{name}: </span> : <span>&nbsp;</span>}
                        {href ? (
                            <a className="link" href={href} target={target} rel={rel}>
                                {value}
                            </a>
                        ) : (
                            <span className="value">{value}</span>
                        )}
                    </div>
                )
            })}
        </React.Fragment>
    )
}
