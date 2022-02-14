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

// import gitChannelData from './ControlDataGit'
// import helmReleaseChannelData from './ControlDataHelm'
// import objectstoreChannelData from './ControlDataObjectStore'
// import otherChannelData from './ControlDataOther'
import { setAvailableNSSpecs, updateControlsForNS, getSharedSubscriptionWarning } from './utils'

import { discoverGroupsFromSource, shiftTemplateObject } from '../transformers/transform-resources-to-controls'
import { listNamespaces } from '../../../../../resources'
import { VALID_DNS_LABEL } from 'temptifly'
import { useRecoilState } from 'recoil'

export const loadExistingNamespaces = () => {
    return {
        query: () => {
            return listNamespaces().promise
        },
        loadingDesc: 'Loading namespaces...',
        setAvailable: setAvailableNSSpecs.bind(null),
    }
}

export const updateNSControls = (nsControl, globalControl) => {
    const { active, availableData = {} } = nsControl

    const userDefinedNSControl = globalControl.find(({ id }) => id === 'userDefinedNamespace')

    userDefinedNSControl.active = availableData[active] === undefined ? active : ''

    return updateControlsForNS(nsControl, nsControl, globalControl)
}

export const controlData = [
    {
        id: 'main',
        type: 'section',
        note: 'creation.view.required.mark',
    },
    {
        name: 'Name',
        tooltip: 'Application name',
        id: 'name',
        type: 'text',
        editing: { disabled: true }, // if editing existing app, disable this field
        validation: {
            constraint: VALID_DNS_LABEL,
            notification:
                "The value must be a valid DNS label that consists of up to 63 lowercase alphanumeric characters. The character '-' is also permitted, as long as it does not appear in the first or last position.",
            required: true,
        },
        reverse: 'Application[0].metadata.name',
    },
    {
        name: 'Namespace',
        tooltip:
            'Set the application namespace from the list of accessible namespaces, or enter a name to create a namespace. You need authority to create namespace resources. ',
        id: 'namespace',
        type: 'combobox',
        fetchAvailable: loadExistingNamespaces(),
        editing: { disabled: true }, // if editing existing app, disable this field
        onSelect: updateNSControls,
        validation: {
            constraint: VALID_DNS_LABEL,
            notification:
                "The value must be a valid DNS label that consists of up to 63 lowercase alphanumeric characters. The character '-' is also permitted, as long as it does not appear in the first or last position.",
            required: true,
        },
        reverse: 'Application[0].metadata.namespace',
    },
    {
        id: 'userDefinedNamespace',
        type: 'hidden',
        active: '',
    },
]
