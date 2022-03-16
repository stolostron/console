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
import React from 'react'
import gitChannelData from './ControlDataGit'
import helmReleaseChannelData from './ControlDataHelm'
import objectstoreChannelData from './ControlDataObjectStore'
import otherChannelData from './ControlDataOther'
import { setAvailableNSSpecs, updateControlsForNS, getSharedSubscriptionWarning } from './utils'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../../lib/rbac-util'
import { NamespaceDefinition } from '../../../../../resources'
import { discoverGroupsFromSource, shiftTemplateObject } from '../transformers/transform-resources-to-controls'
import { listNamespaces } from '../../../../../resources'
import { VALID_DNS_LABEL } from 'temptifly'
import { GitAltIcon, UnknownIcon } from '@patternfly/react-icons'
import HelmIcom from '../../logos/HelmIcon.svg'
import ObjectStore from '../../logos/ObjectStore.svg'

export const loadExistingNamespaces = () => {
    return {
        query: () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const namespaces = await listNamespaces().promise
                    const authorizedNamespaces = await getAuthorizedNamespaces(
                        [rbacCreate(NamespaceDefinition)],
                        namespaces
                    )
                    resolve(authorizedNamespaces)
                } catch (err) {
                    reject(err)
                }
            })
        },
        loadingDesc: 'Loading namespaces...',
        setAvailable: setAvailableNSSpecs.bind(null),
    }
}

export const updateNSControls = (nsControl, globalControl) => {
    const { active, available = [] } = nsControl

    const userDefinedNSControl = globalControl.find(({ id }) => id === 'userDefinedNamespace')

    userDefinedNSControl.active = available.includes(active) ? '' : active
    return updateControlsForNS(nsControl, nsControl, globalControl)
}

export const controlData = async () => [
    {
        id: 'main',
        type: 'section',
        note: 'creation.view.required.mark',
    },
    {
        id: 'showSecrets',
        type: 'hidden',
        active: false,
    },
    {
        name: 'creation.app.name',
        tooltip: 'tooltip.creation.app.name',
        id: 'name',
        type: 'text',
        editing: { disabled: true }, // if editing existing app, disable this field
        validation: {
            constraint: VALID_DNS_LABEL,
            notification: 'import.form.invalid.dns.label',
            required: true,
        },
        reverse: 'Application[0].metadata.name',
    },
    {
        name: 'creation.app.namespace',
        tooltip: 'tooltip.creation.app.namespace',
        id: 'namespace',
        type: 'combobox',
        fetchAvailable: loadExistingNamespaces(),
        editing: { disabled: true }, // if editing existing app, disable this field
        onSelect: updateNSControls,
        validation: {
            constraint: VALID_DNS_LABEL,
            notification: 'import.form.invalid.dns.label',
            required: true,
        },
        reverse: 'Application[0].metadata.namespace',
    },
    {
        id: 'userDefinedNamespace',
        type: 'hidden',
        active: '',
    },
    {
        id: 'selfLink',
        type: 'hidden',
        active: '',
    },
    ////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////  channels  /////////////////////////////////////
    {
        id: 'channelSection',
        type: 'section',
        title: 'creation.app.channels',
        overline: true,
        collapsable: true,
        collapsed: false,
    },
    ///////////////////////  channels  /////////////////////////////////////
    {
        id: 'channels',
        type: 'group',
        prompts: {
            nameId: 'channelPrompt',
            baseName: 'resource',
            addPrompt: 'creation.app.add.channel',
            deletePrompt: 'creation.app.delete.channel',
        },
        discover: discoverGroupsFromSource,
        shift: shiftTemplateObject,
        controlData: [
            {
                id: 'channel',
                type: 'section',
                title: 'creation.app.channel.title',
                collapsable: true,
                collapsed: false,
                info: getSharedSubscriptionWarning,
                editing: { editMode: true },
            },
            ///////////////////////  channel name  /////////////////////////////////////
            {
                id: 'channelPrompt',
                type: 'hidden',
                active: '',
            },
            {
                id: 'selfLinks',
                type: 'hidden',
                active: '',
            },
            {
                id: 'channelType',
                type: 'cards',
                sort: false,
                collapseCardsControlOnSelect: true,
                scrollViewToTopOnSelect: true,
                title: 'creation.app.channel.type',
                collapsable: true,
                collapsed: false,
                available: [
                    {
                        id: 'github',
                        logo: <GitAltIcon />,
                        title: 'channel.type.git',
                        tooltip: 'tooltip.creation.app.channel.git',
                        change: {
                            insertControlData: await gitChannelData(),
                        },
                    },
                    {
                        id: 'helmrepo',
                        logo: <HelmIcom />,
                        title: 'channel.type.helmrepo',
                        tooltip: 'tooltip.channel.type.helmrepo',
                        change: {
                            insertControlData: await helmReleaseChannelData(),
                        },
                    },
                    {
                        id: 'objectstore',
                        logo: <ObjectStore />,
                        title: 'channel.type.objectbucket',
                        tooltip: 'tooltip.channel.type.objectbucket',
                        change: {
                            insertControlData: await objectstoreChannelData(),
                        },
                    },
                    {
                        id: 'other',
                        logo: <UnknownIcon />,
                        title: 'channel.type.other',
                        tooltip: 'tooltip.channel.type.other',
                        hidden: true, // only show this if editing existing app
                        change: {
                            insertControlData: await otherChannelData(),
                        },
                    },
                ],
                active: '',
                validation: {},
            },
        ],
    },
]
