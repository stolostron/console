/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { getAgentsForSelection } from '@openshift-assisted/ui-lib/cim'

import { useRecoilState, useSharedAtoms } from '../shared-recoil'
import { Trans, useTranslation } from '../lib/acm-i18next'
import { NavigationPath } from '../NavigationPath'

const useNoAvailableHostsAlert = (
  controlPlaneType: 'hosted' | 'standalone'
): { title: string; content: React.ReactNode } | undefined => {
  const { t } = useTranslation()
  const { agentsState, infraEnvironmentsState } = useSharedAtoms()
  const [agents] = useRecoilState(agentsState)
  const [infraEnvs] = useRecoilState(infraEnvironmentsState)

  const alert = React.useMemo(() => {
    const availableAgnets = getAgentsForSelection(agents)
    const controlPlaneTypeTxt = controlPlaneType === 'hosted' ? t('hosted control plane') : t('existing hosts')
    if (!infraEnvs.length) {
      return {
        title: t('No infrastructure environments found'),
        content: (
          <Trans
            values={{ controlPlaneTypeTxt: controlPlaneTypeTxt }}
            i18nKey="createCluster.card.noInfraEnvs.alert"
            components={{ a: <a href={NavigationPath.infraEnvironments}>{}</a> }}
          />
        ),
      }
    } else if (!availableAgnets.length) {
      return {
        title: t('No available hosts found'),
        content: (
          <Trans
            values={{ controlPlaneTypeTxt: controlPlaneTypeTxt }}
            i18nKey="createCluster.card.noHosts.alert"
            components={{ a: <a href={NavigationPath.infraEnvironments}>{}</a>, br: <br /> }}
          />
        ),
      }
    } else {
      return undefined
    }
  }, [infraEnvs, agents, t, controlPlaneType])

  return alert
}

export default useNoAvailableHostsAlert
