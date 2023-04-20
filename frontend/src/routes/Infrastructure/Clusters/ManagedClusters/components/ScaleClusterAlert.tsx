/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert } from '../../../../../ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'
import { getReadyReplicas } from '../../../../../resources'
import { Button } from '@patternfly/react-core'

export function ScaleClusterAlert() {
  const { t } = useTranslation()
  const { cluster } = useContext(ClusterContext)
  const { machinePoolsState } = useSharedAtoms()
  const [machinePoolState] = useRecoilState(machinePoolsState)
  const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)

  const totalDesiredReplicas = machinePools.reduce((sum, mp) => sum + (mp.status?.replicas || 0), 0)
  const totalReadyReplicas = machinePools.reduce((sum, mp) => sum + getReadyReplicas(mp), 0)

  if (cluster?.isHive && totalDesiredReplicas !== totalReadyReplicas) {
    /*
            t('machinePool.alert.scaling.increase.message')
            t('machinePool.alert.scaling.decrease.message')
        */
    return (
      <AcmAlert
        isInline
        noClose
        style={{ marginBottom: '24px' }}
        variant="info"
        title={
          totalDesiredReplicas > totalReadyReplicas
            ? t('machinePool.alert.scaling.increase.title')
            : t('machinePool.alert.scaling.decrease.title')
        }
        message={
          <Trans
            i18nKey={
              totalDesiredReplicas > totalReadyReplicas
                ? 'machinePool.alert.scaling.increase.message'
                : 'machinePool.alert.scaling.decrease.message'
            }
            components={{ bold: <strong /> }}
          />
        }
        actions={
          <a
            href={`${cluster!.consoleURL}/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine`}
            target={'_blank'}
            rel="noreferrer"
          >
            <Button variant="link" isInline icon={<ExternalLinkAltIcon />} iconPosition="right">
              {t('machinePool.view.machines')}
            </Button>
          </a>
        }
      />
    )
  }

  return <Fragment />
}
