/* Copyright Contributors to the Open Cluster Management project */

import { addDetails } from './diagram-helpers'
import { AnsibleCondition, Pulse, AnsibleJobStatus, DetailsList, NodeLike, Translator } from '../../types'
import { safeGet } from '../../utils'

const ansibleTaskErrorStates: string[] = ['Failed']
const ansibleTaskSuccessStates: string[] = ['Successful', 'Running']

const ansibleJobErrorStates: string[] = ['failed', 'error']
const ansibleJobSuccessStates: string[] = ['successful', 'running', 'new']
const ansibleJobWarningStates: string[] = ['canceled']

const ansibleStatusStr = 'specs.raw.status.conditions'
const ansibleJobStatusStr = 'specs.raw.status.ansibleJobResult'

const ansibleTaskResultStr = 'ansibleResult'

/**
 * Derive task pulse color and message from Ansible Task conditions.
 * - Error states map to red, success to green, unknown to yellow, missing to orange.
 */
export const getInfoForAnsibleTask = (
  ansibleConditions: AnsibleCondition[]
): { pulse: Pulse | 'orange'; message: string | null } => {
  const ansibleTaskConditionIndex = ansibleConditions.findIndex((condition) => {
    return safeGet(condition, ansibleTaskResultStr, '') !== ''
  })

  const taskStatus: AnsibleCondition | null =
    ansibleTaskConditionIndex === -1 ? null : ansibleConditions[ansibleTaskConditionIndex]
  let reasonStatus = ''
  let taskStatusPulse: Pulse | 'orange' = 'orange'
  if (taskStatus) {
    reasonStatus = safeGet(taskStatus, 'reason', '') as string
    taskStatusPulse = ansibleTaskErrorStates.includes(reasonStatus)
      ? 'red'
      : ansibleTaskSuccessStates.includes(reasonStatus)
        ? 'green'
        : 'yellow'
  }

  return {
    pulse: taskStatusPulse,
    message: taskStatus === null ? null : `${reasonStatus}: ${safeGet(taskStatus, 'message', null) as string | null}`,
  }
}

/**
 * Derive job pulse color, message and URL from Ansible Job status.
 * - Error states map to red, success to green, warnings to yellow, unknown to orange.
 */
export const getInfoForAnsibleJob = (
  jobStatus?: AnsibleJobStatus | null
): { pulse: Pulse | 'orange'; message: string | null; url: string | null } => {
  let reasonStatus = ''
  let jobStatusPulse: Pulse | 'orange' = 'orange' // job is executed by the ansible task
  if (jobStatus) {
    reasonStatus = safeGet(jobStatus, 'status', '') as string
    jobStatusPulse = ansibleJobErrorStates.includes(reasonStatus)
      ? 'red'
      : ansibleJobSuccessStates.includes(reasonStatus)
        ? 'green'
        : ansibleJobWarningStates.includes(reasonStatus)
          ? 'yellow'
          : 'orange'
  }

  return {
    pulse: jobStatusPulse,
    message: jobStatus === null ? null : reasonStatus,
    url: jobStatus === null ? null : (safeGet(jobStatus, 'url', null) as string | null),
  }
}

/**
 * Compute a consolidated pulse color for an Ansible node by combining task and job pulses.
 * Red overrides Yellow, which overrides Orange. Green only if neither is Red/Yellow/Orange.
 */
export const getPulseStatusForAnsibleNode = (node: NodeLike): Pulse | 'orange' => {
  const ansibleConditions = safeGet(node, ansibleStatusStr, []) as AnsibleCondition[]
  if (ansibleConditions.length === 0) {
    return 'orange'
  }

  const taskStatusPulse = getInfoForAnsibleTask(ansibleConditions).pulse
  const jobStatusPulse = getInfoForAnsibleJob(safeGet(node, ansibleJobStatusStr) as AnsibleJobStatus).pulse
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

/**
 * Map pulse color to UI status icon identifier.
 */
export const getStatusFromPulse = (pulse?: Pulse): 'failure' | 'warning' | 'pending' | 'checkmark' => {
  if (!pulse) {
    return 'pending'
  }

  let statusStr: 'failure' | 'warning' | 'pending' | 'checkmark'
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

/**
 * Populate details panel entries for an Ansible Job associated with a node.
 * Adds template name, secret (when present), job URL, and status lines for task and job.
 */
export const showAnsibleJobDetails = (node: NodeLike, details: DetailsList, t: Translator): DetailsList => {
  const ansibleConditions = safeGet(node, ansibleStatusStr, []) as AnsibleCondition[]

  const taskStatus = getInfoForAnsibleTask(ansibleConditions)
  const jobStatus = getInfoForAnsibleJob(safeGet(node, ansibleJobStatusStr) as AnsibleJobStatus)

  addDetails(details, [
    {
      labelValue: t('Ansible Tower Job template name'),
      value: safeGet(node, 'specs.raw.status.k8sJob.env.templateName'),
    },
    {
      labelValue: t('Ansible Tower secret'),
      value: safeGet(node, 'specs.raw.status.k8sJob.env.secretNamespacedName'),
    },
  ])

  details.push({
    type: 'spacer',
  })

  let jobUrl = safeGet(jobStatus, 'url') as string | null
  if (jobUrl) {
    if (!jobUrl.startsWith('http')) {
      jobUrl = `https://${jobUrl}`
    }

    details.push({
      type: 'label',
      labelValue: t('Ansible Tower Job URL'),
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
    status: getStatusFromPulse(taskStatus.pulse as Pulse),
  })
  details.push({
    type: 'spacer',
  })

  details.push({
    labelValue: t('description.ansible.job.status'),
    value: safeGet(jobStatus, 'message', '') === '' ? t('description.ansible.job.status.empty') : jobStatus.message,
    status: getStatusFromPulse(jobStatus.pulse as Pulse),
  })
  if (safeGet(node, 'specs.raw.status.k8sJob.message')) {
    details.push({
      labelValue: t('prop.details.section'),
      value: t('description.ansible.job.status.debug'),
    })
  }

  return details
}
