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

import { useMemo } from 'react'
import gitChannelData from './ControlDataGit'
import helmReleaseChannelData from './ControlDataHelm'
import objectstoreChannelData from './ControlDataObjectStore'
import otherChannelData from './ControlDataOther'
import { setAvailableNSSpecs, updateControlsForNS, getSharedSubscriptionWarning } from './utils'
import { listProjects } from '../../../../../resources'
import { discoverGroupsFromSource, shiftTemplateObject } from '../transformers/transform-resources-to-controls'
import { VALID_DNS_LABEL } from '../../../../../components/TemplateEditor'
import { GitAltIcon, UnknownIcon } from '@patternfly/react-icons'
import HelmIcom from '../../logos/HelmIcon.svg'
import ObjectStore from '../../logos/ObjectStore.svg'
import { useTranslation } from '../../../../../lib/acm-i18next'

export const loadExistingNamespaces = () => {
    return {
        query: () => {
            return new Promise(async (resolve, reject) => {
                try {
                    const namespaces = await listProjects().promise
                    resolve(namespaces)
                } catch (err) {
                    reject(err)
                }
            })
        },
        loadingDesc: 'Loading namespaces...',
        setAvailable: setAvailableNSSpecs.bind(null),
    }
}

export const updateNameControls = (nameControl, globalControl) => {
    const channelsControl = globalControl.find(({ id }) => id === 'channels')
    channelsControl?.active.forEach((subscription) => {
        const placementCheckbox = subscription.find(({ id }) => id === 'existingrule-checkbox')
        if (!placementCheckbox?.active) {
            const rule = subscription.find(({ id }) => id === 'selectedRuleName')
            if (rule?.active) rule.active = undefined
        }
    })
}

export const updateNSControls = (nsControl, globalControl) => {
    const { active, available = [] } = nsControl

    const userDefinedNSControl = globalControl.find(({ id }) => id === 'userDefinedNamespace')

    userDefinedNSControl.active = available.includes(active) ? '' : active
    return updateControlsForNS(nsControl, nsControl, globalControl)
}

export const useControlData = (isLocalCluster, handleModalToggle) => {
    const { t } = useTranslation()
    return useMemo(
        () => [
            {
                id: 'main',
                type: 'section',
                note: t('creation.view.required.mark'),
            },
            {
                id: 'showSecrets',
                type: 'hidden',
                active: false,
            },
            {
                name: t('creation.app.name'),
                tooltip: t('tooltip.creation.app.name'),
                id: 'name',
                type: 'text',
                editing: { disabled: true }, // if editing existing app, disable this field
                onSelect: updateNameControls,
                validation: {
                    constraint: VALID_DNS_LABEL,
                    notification: t('import.form.invalid.dns.label'),
                    required: true,
                },
                reverse: 'Application[0].metadata.name',
            },
            {
                name: t('creation.app.namespace'),
                tooltip: t('tooltip.creation.app.namespace'),
                id: 'namespace',
                type: 'combobox',
                fetchAvailable: loadExistingNamespaces(),
                editing: { disabled: true }, // if editing existing app, disable this field
                onSelect: updateNSControls,
                validation: {
                    constraint: VALID_DNS_LABEL,
                    notification: t('import.form.invalid.dns.label'),
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
                title: t('creation.app.channels'),
                collapsable: true,
                collapsed: false,
            },
            ///////////////////////  channels  /////////////////////////////////////
            {
                id: 'channels',
                type: 'group',
                prompts: {
                    nameId: 'channelPrompt',
                    baseName: t('resource'),
                    addPrompt: t('creation.app.add.channel'),
                    deletePrompt: t('creation.app.delete.channel'),
                },
                discover: discoverGroupsFromSource,
                shift: shiftTemplateObject,
                controlData: [
                    {
                        id: 'channel',
                        type: 'section',
                        title: t('creation.app.channel.title'),
                        collapsable: true,
                        collapsed: false,
                        subgroup: true,
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
                        title: t('creation.app.channel.type'),
                        collapsable: true,
                        collapsed: false,
                        available: [
                            {
                                id: 'github',
                                logo: <GitAltIcon />,
                                title: t('channel.type.git'),
                                tooltip: t('tooltip.creation.app.channel.git'),
                                change: {
                                    insertControlData: gitChannelData(isLocalCluster, handleModalToggle),
                                },
                            },
                            {
                                id: 'helmrepo',
                                logo: <HelmIcom />,
                                title: t('channel.type.helmrepo'),
                                tooltip: t('tooltip.channel.type.helmrepo'),
                                change: {
                                    insertControlData: helmReleaseChannelData(isLocalCluster),
                                },
                            },
                            {
                                id: 'objectstore',
                                logo: <ObjectStore />,
                                title: t('channel.type.objectbucket'),
                                tooltip: t('tooltip.channel.type.objectbucket'),
                                change: {
                                    insertControlData: objectstoreChannelData(isLocalCluster),
                                },
                            },
                            {
                                id: 'other',
                                logo: <UnknownIcon />,
                                title: t('channel.type.other'),
                                tooltip: t('tooltip.channel.type.other'),
                                hidden: true, // only show this if editing existing app
                                change: {
                                    insertControlData: otherChannelData(isLocalCluster),
                                },
                            },
                        ],
                        active: '',
                        validation: {},
                    },
                ],
            },
        ],
        [handleModalToggle, isLocalCluster, t]
    )
}
