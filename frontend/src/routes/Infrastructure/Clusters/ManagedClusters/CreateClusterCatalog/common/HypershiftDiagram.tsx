/* Copyright Contributors to the Open Cluster Management project */

import { useTranslation } from '../../../../../../lib/acm-i18next'
import './HypershiftDiagram.css'

function Block({ labels, color }: Readonly<{ labels: string[]; color: 'blue' | 'green' | 'neutral' }>) {
  return (
    <div className={`hypershift-diagram-block hypershift-diagram-block--${color}`}>
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  )
}

function ControlPlaneCell({ clusterName, color }: Readonly<{ clusterName: string; color: 'blue' | 'green' }>) {
  const [t] = useTranslation()
  return (
    <div className="hypershift-diagram-cell">
      <span className="hypershift-diagram-heading">{clusterName}</span>
      <span className="hypershift-diagram-heading">{t('namespace')}</span>
      <span className="hypershift-diagram-subtext">({t('control plane')})</span>
      <Block labels={['api-server']} color={color} />
      <Block labels={['etcd']} color={color} />
      <Block labels={[t('Other'), t('components')]} color={color} />
    </div>
  )
}

function WorkerCell({ clusterName, color }: Readonly<{ clusterName: string; color: 'blue' | 'green' }>) {
  const [t] = useTranslation()
  return (
    <div className="hypershift-diagram-cell">
      <span className="hypershift-diagram-heading">{clusterName}</span>
      <span className="hypershift-diagram-heading" style={{ paddingBottom: '20px' }}>
        {t('worker nodes')}
      </span>
      <Block labels={[t('Worker'), t('nodes xN')]} color={color} />
    </div>
  )
}

export function HypershiftDiagram() {
  const [t] = useTranslation()

  return (
    <div className="hypershift-diagram">
      {/* Hosted control plane */}
      <div className="hypershift-diagram-column">
        <span className="hypershift-diagram-heading">{t('Hosted control plane')}</span>
        <span className="hypershift-diagram-subtext">({t('decoupled control plane and workers')})</span>

        <div className="hypershift-diagram-panel">
          <span className="hypershift-diagram-heading">{t('Hosting service cluster')}</span>
          <span className="hypershift-diagram-subtext">({t('hosts the control planes')})</span>

          <div className="hypershift-diagram-bordered">
            <span className="hypershift-diagram-label">{t('Hosting service cluster node')}</span>
            <div className="hypershift-diagram-row">
              <ControlPlaneCell clusterName={t('Cluster 1')} color="blue" />
              <ControlPlaneCell clusterName={t('Cluster 2')} color="green" />
            </div>
          </div>
        </div>

        <div className="hypershift-diagram-row" style={{ paddingTop: '18px' }}>
          <WorkerCell clusterName={t('Cluster 1')} color="blue" />
          <WorkerCell clusterName={t('Cluster 2')} color="green" />
        </div>
      </div>

      {/* Standalone control plane */}
      <div className="hypershift-diagram-column">
        <span className="hypershift-diagram-heading">{t('Standalone control plane')}</span>
        <span className="hypershift-diagram-subtext">({t('dedicated control plane nodes')})</span>

        <div className="hypershift-diagram-row">
          <div className="hypershift-diagram-panel">
            <span className="hypershift-diagram-heading">{t('Single cluster')}</span>
            <span className="hypershift-diagram-heading" style={{ paddingBottom: '20px' }}>
              {t('control plane')}
            </span>
            <div className="hypershift-diagram-bordered">
              <span className="hypershift-diagram-label">{t('Control nodes x3')}</span>
              <Block labels={['api-server']} color="neutral" />
              <Block labels={['etcd']} color="neutral" />
              <Block labels={['kcm']} color="neutral" />
              <Block labels={[t('Other'), t('components')]} color="neutral" />
            </div>
          </div>
          <div className="hypershift-diagram-panel">
            <span className="hypershift-diagram-heading" style={{ paddingBottom: '44px' }}>
              {t('Worker pool')}
            </span>
            <div className="hypershift-diagram-bordered">
              <span className="hypershift-diagram-label">{t('Worker nodes xN')}</span>
              <Block labels={[t('Workloads xN')]} color="neutral" />
              <Block labels={['SDN']} color="neutral" />
              <Block labels={['Kubelet']} color="neutral" />
              <Block labels={['CRI-O']} color="neutral" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
