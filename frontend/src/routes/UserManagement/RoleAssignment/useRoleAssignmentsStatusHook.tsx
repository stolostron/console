/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { AcmAlertInfoWithId, AcmToastContext } from '../../../ui-components'
import { useClusterNamespaceMap } from '../../../utils/useClusterNamespaceMap'
import { CommonProjectCreateProgressBar } from '../../../wizards/RoleAssignment/CommonProjectCreateProgressBar'
import { RoleAssignmentStatusComponentProps } from './RoleAssignmentStatusComponent'
import {
  handleMissingNamespaces as handleMissingNamespacesFn,
  type MultipleCallbackProgress,
} from './roleAssignmentErrorHandlingFunctions'

const useRoleAssignmentsStatusHook = () => {
  const { clusterNamespaceMap } = useClusterNamespaceMap()
  const [callbackProgress, setCallbackProgress] = useState<MultipleCallbackProgress>({
    successCount: 0,
    errorCount: 0,
    totalCount: 0,
    errorClusterNamespacesMap: {},
  })

  const [isProcessingRoleAssignmentMap, setIsProcessingRoleAssignmentMap] = useState<Record<string, boolean>>({})
  const [roleAssignmentToProcess, setRoleAssignmentToProcess] = useState<FlattenedRoleAssignment>()
  const [creatingMissingProjectsAlert, setCreatingMissingProjectsAlert] = useState<AcmAlertInfoWithId>()
  const isAnyRoleAssignmentProcessing = useMemo(() => roleAssignmentToProcess !== undefined, [roleAssignmentToProcess])

  const toastContext = useContext(AcmToastContext)
  const { t } = useTranslation()

  const handleMissingNamespaces = useCallback(
    (roleAssignment: FlattenedRoleAssignment) => {
      void handleMissingNamespacesFn(roleAssignment, {
        clusterNamespaceMap,
        addAlertCallback: toastContext.addAlert,
        t,
        onStartCallback: (ra, creatingAlert) => {
          setIsProcessingRoleAssignmentMap((prev) => ({ ...prev, [ra.name]: true }))
          setRoleAssignmentToProcess(ra)
          setCreatingMissingProjectsAlert(creatingAlert)
        },
        onProgressCallback: setCallbackProgress,
      })
    },
    [clusterNamespaceMap, toastContext, t]
  )

  useEffect(
    () => () => {
      if (toastContext && creatingMissingProjectsAlert) {
        toastContext.removeAlert(creatingMissingProjectsAlert)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creatingMissingProjectsAlert]
  )

  useEffect(() => {
    if (creatingMissingProjectsAlert && roleAssignmentToProcess) {
      toastContext.modifyAlert({
        ...creatingMissingProjectsAlert,
        message: (
          <CommonProjectCreateProgressBar
            successCount={callbackProgress.successCount}
            errorCount={callbackProgress.errorCount}
            totalCount={callbackProgress.totalCount}
            hideTitle={true}
          />
        ),
        type: callbackProgress.errorCount > 0 ? 'danger' : 'info',
      })
    }
  }, [callbackProgress, creatingMissingProjectsAlert, roleAssignmentToProcess, toastContext])

  useEffect(() => {
    if (
      roleAssignmentToProcess?.name &&
      callbackProgress.totalCount > 0 &&
      callbackProgress.successCount + callbackProgress.errorCount === callbackProgress.totalCount
    ) {
      setIsProcessingRoleAssignmentMap((prev) => ({ ...prev, [roleAssignmentToProcess.name]: false }))
      setRoleAssignmentToProcess(undefined)
      if (creatingMissingProjectsAlert) {
        toastContext.removeAlert(creatingMissingProjectsAlert)
      }

      if (callbackProgress.errorCount > 0) {
        toastContext.addAlert({
          title: t('Error creating missing projects'),
          message: t('Error creating missing projects {{project}} for clusters {{cluster}}.', {
            clusters: Object.keys(callbackProgress.errorClusterNamespacesMap).join(', '),
            projects: Object.values(callbackProgress.errorClusterNamespacesMap).flat().join(', '),
            errorCount: callbackProgress.errorCount,
          }),
          type: 'danger',
          autoClose: true,
        })
      } else {
        toastContext.addAlert({
          title: t('Missing projects created'),
          message: t('Missing projects for {{name}} have been successfully created.', {
            name: roleAssignmentToProcess.name,
          }),
          type: 'success',
          autoClose: true,
        })
      }
    }
  }, [callbackProgress, creatingMissingProjectsAlert, roleAssignmentToProcess?.name, t, toastContext])

  const callbackMap: RoleAssignmentStatusComponentProps['callbackMap'] = {
    MissingNamespaces: (roleAssignment) => {
      void handleMissingNamespaces(roleAssignment)
    },
    Processing: () => {
      throw new Error('Processing callback not implemented')
    },
    InvalidReference: () => {
      throw new Error('InvalidReference callback not implemented')
    },
    NoMatchingClusters: () => {
      throw new Error('NoMatchingClusters callback not implemented')
    },
    SuccessfullyApplied: () => {
      throw new Error('SuccessfullyApplied callback not implemented')
    },
    ApplicationFailed: () => {
      throw new Error('SuccessfullyApplied callback not implemented')
    },
  }
  return {
    callbackMap,
    isProcessingRoleAssignmentMap,
    isAnyRoleAssignmentProcessing,
  }
}

export { useRoleAssignmentsStatusHook }
