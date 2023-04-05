/* Copyright Contributors to the Open Cluster Management project */

import { Split, SplitItem } from '@patternfly/react-core'
import { useTranslation } from '../../../../../lib/acm-i18next'
import './HypershiftDiagram.css'

export function HypershiftDiagram() {
  const [t] = useTranslation()
  const titleOne = {
    fontSize: '18px',
    fontWeight: 'bolder',
    display: 'block',
  }
  const subtitleOne = {
    fontSize: '18px',
    display: 'block',
    paddingBottom: '20px',
    color: 'var(--pf-global--Color--200)',
  }
  const controlPlaneStyle = {
    backgroundColor: 'var(--pf-global--BackgroundColor--200)',
    padding: '18px',
  }
  const controlPlaneTitleStyle = {
    fontSize: '14px',
    display: 'block',
    fontWeight: 'bolder',
  }
  const controlPlaneSubTitleStyle = {
    fontSize: '14px',
    display: 'block',
    paddingBottom: '20px',
    color: 'var(--pf-global--Color--200)',
  }
  const standardOCPComponentStyle = {
    textAlign: 'center' as const,
    padding: '12px 24px 12px 24px',
    backgroundColor: 'var(--pf-global--BackgroundColor--200)',
  }
  return (
    <Split hasGutter style={{ width: '69%' }}>
      <SplitItem isFilled className="hypershift-diagram-majorRectStyle">
        <span style={titleOne}>{t('Hosted control plane')}</span>
        <span style={subtitleOne}>({t('decoupled control plane and workers')})</span>
        <div className="hypershift-diagram-middleRectStyle">
          <span style={{ fontSize: '16px', display: 'block', fontWeight: 'bolder' }}>
            {t('Hosting service cluster')}
          </span>
          <span
            style={{ fontSize: '16px', display: 'block', paddingBottom: '20px', color: 'var(--pf-global--Color--200)' }}
          >
            ({t('hosts the control planes')})
          </span>
          <div className="hypershift-diagram-minorRectStyle">
            <span style={{ paddingBottom: '20px', display: 'block' }}>{t('Hosting service cluster node')}</span>
            <Split hasGutter>
              <SplitItem isFilled style={controlPlaneStyle}>
                <span style={controlPlaneTitleStyle}>{t('Cluster 1')}</span>
                <span style={controlPlaneTitleStyle}>{t('namespace')}</span>
                <span style={controlPlaneSubTitleStyle}>({t('control plane')})</span>
                <div className="hypershift-diagram-blueBlockStyle">
                  <span style={{ fontWeight: 'bolder' }}>api-server</span>
                </div>
                <div style={{ paddingTop: '10px' }}></div>
                <div className="hypershift-diagram-blueBlockStyle">
                  <span style={{ fontWeight: 'bolder' }}>etcd</span>
                </div>
                <div style={{ paddingTop: '10px' }}></div>
                <div className="hypershift-diagram-blueBlockStyle">
                  <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('Other')}</span>
                  <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('components')}</span>
                </div>
              </SplitItem>
              <SplitItem isFilled style={controlPlaneStyle}>
                <span style={controlPlaneTitleStyle}>{t('Cluster 2')}</span>
                <span style={controlPlaneTitleStyle}>{t('namespace')}</span>
                <span style={controlPlaneSubTitleStyle}>({t('control plane')})</span>
                <div className="hypershift-diagram-greenBlockStyle">
                  <span style={{ fontWeight: 'bolder' }}>api-server</span>
                </div>
                <div style={{ paddingTop: '10px' }}></div>
                <div className="hypershift-diagram-greenBlockStyle">
                  <span style={{ fontWeight: 'bolder' }}>etcd</span>
                </div>
                <div style={{ paddingTop: '10px' }}></div>
                <div className="hypershift-diagram-greenBlockStyle">
                  <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('Other')}</span>
                  <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('components')}</span>
                </div>
              </SplitItem>
            </Split>
          </div>
        </div>
        <div style={{ padding: '18px 40px 18px 40px' }}>
          <Split hasGutter>
            <SplitItem isFilled style={{ backgroundColor: 'var(--pf-global--BackgroundColor--200)', padding: '18px' }}>
              <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bolder' }}>{t('Cluster 1')}</span>
              <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bolder', paddingBottom: '20px' }}>
                {t('worker nodes')}
              </span>
              <div className="hypershift-diagram-blueBlockStyle-noTextAlign">
                <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('Worker')}</span>
                <span style={{ fontWeight: 'bolder' }}>{t('nodes xN')}</span>
              </div>
            </SplitItem>
            <SplitItem isFilled style={{ backgroundColor: 'var(--pf-global--BackgroundColor--200)', padding: '18px' }}>
              <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bolder' }}>{t('Cluster 2')}</span>
              <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bolder', paddingBottom: '20px' }}>
                {t('worker nodes')}
              </span>
              <div className="hypershift-diagram-greenBlockStyle-noTextAlign">
                <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('Worker')}</span>
                <span style={{ fontWeight: 'bolder' }}>{t('nodes xN')}</span>
              </div>
            </SplitItem>
          </Split>
        </div>
      </SplitItem>
      <SplitItem isFilled className="hypershift-diagram-majorRectStyle">
        <span style={titleOne}>{t('Standalone control plane')}</span>
        <span style={subtitleOne}>({t('dedicated control plane nodes')})</span>
        <Split hasGutter>
          <SplitItem isFilled className="hypershift-diagram-middleRectStyle">
            <span style={{ fontSize: '16px', display: 'block', fontWeight: 'bolder' }}>{t('Single cluster')}</span>
            <span style={{ fontSize: '16px', display: 'block', fontWeight: 'bolder', paddingBottom: '20px' }}>
              {t('control plane')}
            </span>
            <div className="hypershift-diagram-minorRectStyle">
              <span style={{ display: 'block', paddingBottom: '20px' }}>{t('Control nodes x3')}</span>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>api-server</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>etcd</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>kcm</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('Other')}</span>
                <span style={{ fontWeight: 'bolder', display: 'block' }}>{t('components')}</span>
              </div>
              <div style={{ paddingTop: '60px' }}></div>
            </div>
          </SplitItem>
          <SplitItem isFilled className="hypershift-diagram-middleRectStyle">
            <span style={{ fontSize: '16px', display: 'block', fontWeight: 'bolder', paddingBottom: '44px' }}>
              {t('Worker pool')}
            </span>
            <div className="hypershift-diagram-minorRectStyle">
              <span style={{ display: 'block', paddingBottom: '20px' }}>{t('Worker nodes xN')}</span>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>{t('Workloads xN')}</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>SDN</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>Kubelet</span>
              </div>
              <div style={{ paddingTop: '10px' }}></div>
              <div style={standardOCPComponentStyle}>
                <span style={{ fontWeight: 'bolder' }}>CRI-O</span>
                <div style={{ paddingTop: '20px' }}></div>
              </div>
              <div style={{ paddingTop: '65px' }}></div>
            </div>
          </SplitItem>
        </Split>
      </SplitItem>
    </Split>
  )
}
