/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'
import { addDetails } from '../helpers/diagram-helpers'

const ansibleTaskErrorStates = ['Failed']
const ansibleTaskSuccessStates = ['Successful', 'Running']

const ansibleJobErrorStates = ['failed', 'error']
const ansibleJobSuccessStates = ['successful', 'running', 'new']
const ansibleJobWarningStates = ['canceled']

const ansibleStatusStr = 'specs.raw.status.conditions'
const ansibleJobStatusStr = 'specs.raw.status.ansibleJobResult'

const ansibleTaskResultStr = 'ansibleResult'

export const getInfoForAnsibleTask = (ansibleConditions) => {
    const ansibleTaskConditionIndex = _.findIndex(ansibleConditions, (condition) => {
        return _.get(condition, ansibleTaskResultStr, '') !== ''
    })

    const taskStatus = ansibleTaskConditionIndex === -1 ? null : ansibleConditions[ansibleTaskConditionIndex]
    let reasonStatus = ''
    let taskStatusPulse = 'orange'
    if (taskStatus) {
        reasonStatus = _.get(taskStatus, 'reason', '')
        taskStatusPulse =
            _.indexOf(ansibleTaskErrorStates, reasonStatus) >= 0
                ? 'red'
                : _.indexOf(ansibleTaskSuccessStates, reasonStatus) >= 0
                ? 'green'
                : 'yellow'
    }

    return {
        pulse: taskStatusPulse,
        message: taskStatus === null ? null : `${reasonStatus}: ${_.get(taskStatus, 'message', null)}`,
    }
}

export const getInfoForAnsibleJob = (jobStatus) => {
    let reasonStatus = ''
    let jobStatusPulse = 'orange' //job is executed by the ansible task
    if (jobStatus) {
        reasonStatus = _.get(jobStatus, 'status', '')
        jobStatusPulse =
            _.indexOf(ansibleJobErrorStates, reasonStatus) >= 0
                ? 'red'
                : _.indexOf(ansibleJobSuccessStates, reasonStatus) >= 0
                ? 'green'
                : _.indexOf(ansibleJobWarningStates, reasonStatus) >= 0
                ? 'yellow'
                : 'orange'
    }

    return {
        pulse: jobStatusPulse,
        message: jobStatus === null ? null : reasonStatus,
        url: jobStatus === null ? null : _.get(jobStatus, 'url', null),
    }
}

export const getPulseStatusForAnsibleNode = (node) => {
    const ansibleConditions = _.get(node, ansibleStatusStr, [])
    if (ansibleConditions.length === 0) {
        return 'orange'
    }

    const taskStatusPulse = getInfoForAnsibleTask(ansibleConditions).pulse
    const jobStatusPulse = getInfoForAnsibleJob(_.get(node, ansibleJobStatusStr)).pulse
    if (taskStatusPulse === 'red' || jobStatusPulse === 'red') {
        return 'red'
    }

    if (taskStatusPulse === 'yellow' || jobStatusPulse === 'yellow') {
        return 'yellow'
    }

    if (taskStatusPulse === 'orange' || jobStatusPulse === 'orange') {
        return 'orange'
    }
    return 'green'
}

export const getStatusFromPulse = (pulse) => {
    if (!pulse) {
        return 'pending'
    }

    let statusStr
    switch (pulse) {
        case 'red':
            statusStr = 'failure'
            break
        case 'yellow':
            statusStr = 'warning'
            break
        case 'orange':
            statusStr = 'pending'
            break
        default:
            statusStr = 'checkmark'
            break
    }

    return statusStr
}
export const showAnsibleJobDetails = (node, details, t) => {
    const ansibleConditions = _.get(node, ansibleStatusStr, [])

    const taskStatus = getInfoForAnsibleTask(ansibleConditions)
    const jobStatus = getInfoForAnsibleJob(_.get(node, ansibleJobStatusStr))

    addDetails(details, [
        {
            labelKey: t('Ansible Tower Job template name'),
            value: _.get(node, 'specs.raw.status.k8sJob.env.templateName'),
        },
        {
            labelKey: t('Ansible Tower secret'),
            value: _.get(node, 'specs.raw.status.k8sJob.env.secretNamespacedName'),
        },
    ])

    details.push({
        type: 'spacer',
    })

    let jobUrl = _.get(jobStatus, 'url')
    if (jobUrl) {
        if (!_.startsWith(jobUrl, 'http')) {
            jobUrl = `https://${jobUrl}`
        }

        details.push({
            type: 'label',
            labelKey: t('Ansible Tower Job URL'),
        })

        details.push({
            type: 'link',
            value: {
                label: jobUrl,
                id: `${jobUrl}-location`,
                data: {
                    action: 'open_link',
                    targetLink: jobUrl,
                },
            },
            indent: true,
        })
        details.push({
            type: 'spacer',
        })
    }

    details.push({
        labelValue: t('description.ansible.task.status'),
        value: taskStatus.message ? taskStatus.message : t('description.ansible.job.status.empty.err'),
        status: getStatusFromPulse(taskStatus.pulse),
    })
    details.push({
        type: 'spacer',
    })

    details.push({
        labelValue: t('description.ansible.job.status'),
        value: _.get(jobStatus, 'message', '') === '' ? t('description.ansible.job.status.empty') : jobStatus.message,
        status: getStatusFromPulse(jobStatus.pulse),
    })
    _.get(node, 'specs.raw.status.k8sJob.message') &&
        details.push({
            labelValue: t('prop.details.section'),
            value: t('description.ansible.job.status.debug'),
        })

    return details
}
