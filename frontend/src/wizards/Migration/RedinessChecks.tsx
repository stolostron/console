/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { Tabs, Tab, TabTitleText, TabContentBody, Divider, Title, Icon, Button } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, CheckIcon } from '@patternfly/react-icons'
import { NetworkMappingSection } from './sections/NetworkMappingSection'
import { StorageMappingSection } from './sections/StorageMappingSection'
import { ComputeCompatSection } from './sections/ComputeCompatSection'
import { VersionCompatSection } from './sections/VersionCompatSection'
import { ResourceCapacitySection } from './sections/ResourceCapacitySection'
import { useReadinessChecks } from './useReadinessChecks'

interface SelectOptionInput {
  id: string
  value: string
  text: string
}

interface ReadinessProps {
  networkOpts: SelectOptionInput[]
  storageOpts: SelectOptionInput[]
  computeOptions: SelectOptionInput[]
  srcNetwork: string
  setSrcNetwork: (networkName: string) => void
  dstNetwork: string
  setDstNetwork: (networkName: string) => void
  srcStorage: string
  setSrcStorage: (storageName: string) => void
  dstStorage: string
  setDstStorage: (storageName: string) => void
  srcCompute: string
  setSrcCompute: (computeName: string) => void
  dstCompute: string
  setDstCompute: (computeName: string) => void
}

export default function ReadinessSection(props: ReadinessProps) {
  const [activeTabKey, setActiveTabKey] = useState(0)
  const {
    networkCheckStatus,
    storageCheckStatus,
    computeCheckStatus,
    versionCheckStatus,
    resourceCheckStatus,
    readyToMigrate,
  } = useReadinessChecks()

  const readinessTabs = [
    {
      label: 'Network mapping',
      icon: networkCheckStatus,
      content: <NetworkMappingSection options={props.networkOpts} {...props} />,
    },
    {
      label: 'Storage mapping',
      icon: storageCheckStatus,
      content: <StorageMappingSection options={props.storageOpts} {...props} />,
    },
    {
      label: 'Compute compatibility',
      icon: computeCheckStatus,
      content: <ComputeCompatSection {...props} />,
    },
    {
      label: 'Version compatibility',
      icon: versionCheckStatus,
      content: <VersionCompatSection />,
    },
    {
      label: 'Resource capacity',
      icon: resourceCheckStatus,
      content: <ResourceCapacitySection />,
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content' }}>
        <Button style={{ marginTop: '-3.5rem', marginLeft: '12rem', textAlign: 'end' }} variant="link">
          Run again
        </Button>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'fit-content',
            marginTop: '1rem',
          }}
        >
          <Title headingLevel="h4">
            {readyToMigrate ? (
              <>
                <Icon status="success" style={{ marginRight: 6 }}>
                  <CheckCircleIcon />
                </Icon>
                Ready to migrate
              </>
            ) : (
              <>
                <Icon status="danger" style={{ marginRight: 6 }}>
                  <ExclamationCircleIcon />
                </Icon>
                Some checks were not successful
              </>
            )}
          </Title>
          <div style={{ textAlign: 'end' }}>
            {' '}
            {readyToMigrate ? '5 successful checks' : '1 failed check, 4 successful checks'}
          </div>
        </div>
      </div>

      <Divider style={{ marginLeft: '-2rem', width: '120%', marginTop: '1rem' }} inset={{ default: 'insetNone' }} />

      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ minWidth: 240, maxWidth: 260 }}>
          <Tabs
            isVertical
            activeKey={activeTabKey}
            onSelect={(_, k) => setActiveTabKey(Number(k))}
            aria-label="Readiness tabs"
            role="region"
            style={{ marginLeft: '-1.6rem', height: '110%', borderRight: '1px solid #c7c7c7' }}
          >
            {readinessTabs.map((tab, idx) => (
              <Tab
                key={tab.label}
                eventKey={idx}
                title={
                  <TabTitleText>
                    <Icon status={tab.icon ? 'success' : 'danger'} style={{ marginRight: 6 }}>
                      {tab.icon ? <CheckIcon /> : <ExclamationCircleIcon />}
                    </Icon>
                    {tab.label}
                  </TabTitleText>
                }
              />
            ))}
          </Tabs>
        </div>
        <div style={{ flex: 1, paddingLeft: 24 }}>
          <TabContentBody>{readinessTabs[activeTabKey].content}</TabContentBody>
        </div>
      </div>
    </>
  )
}
