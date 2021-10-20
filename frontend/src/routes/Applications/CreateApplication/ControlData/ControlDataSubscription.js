/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { VALID_DNS_LABEL } from 'temptifly'

export const ControlDataSubscription = [
    ///////////////////////  Details  /////////////////////////////////////
    {
        id: 'detailsStep',
        type: 'step',
        title: 'application.subscription.details.step',
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
        // fetchAvailable: loadExistingNamespaces(),
        editing: { disabled: true }, // if editing existing app, disable this field
        // onSelect: updateNSControls,
        validation: {
            constraint: VALID_DNS_LABEL,
            notification: 'import.form.invalid.dns.label',
            required: true,
        },
        reverse: 'Application[0].metadata.namespace',
    },

    ///////////////////////  Repository  /////////////////////////////////////
    {
        id: 'repositoryStep',
        type: 'step',
        title: 'application.subscription.repository.step',
    },
    ///////////////////////  Placement  /////////////////////////////////////
    {
        id: 'placementStep',
        type: 'step',
        title: 'application.subscription.placement.step',
    },
    ///////////////////////  Settings  /////////////////////////////////////
    {
        id: 'settingsStep',
        type: 'step',
        title: 'application.subscription.settings.step',
    },
]
