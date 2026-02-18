/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlertList, AcmAlertListItem } from './AcmAlertList'
import { Button } from '@patternfly/react-core'

/**
 * Example usage of AcmAlertList component
 */
export function AcmAlertListExample() {
  // Define your alerts array matching PatternFly Alert props
  const alerts: AcmAlertListItem[] = [
    {
      key: 'success-alert',
      variant: 'success',
      title: 'Operation completed successfully',
      children: 'Your changes have been saved.',
    },
    {
      key: 'warning-alert',
      variant: 'warning',
      title: 'Warning: Resource limit approaching',
      children: 'You are using 85% of your allocated storage.',
      actionClose: true,
    },
    {
      key: 'info-alert',
      variant: 'info',
      title: 'System maintenance scheduled',
      children: 'The system will undergo maintenance on February 20, 2026.',
      actionLinks: (
        <Button variant="link" isInline>
          Learn more
        </Button>
      ),
    },
    {
      key: 'danger-alert',
      variant: 'danger',
      title: 'Failed to connect to cluster',
      children: 'Unable to establish connection. Please check your network settings.',
      isExpandable: true,
    },
  ]

  return (
    <div style={{ padding: '1rem' }}>
      {/* Basic usage */}
      <AcmAlertList alerts={alerts} />

      {/* Inline alerts */}
      <AcmAlertList alerts={alerts} isInline />

      {/* Toast-style alerts with live region for accessibility */}
      <AcmAlertList alerts={alerts} isToast isLiveRegion />

      {/* Custom styling */}
      <AcmAlertList alerts={alerts} isInline style={{ marginTop: '2rem' }} className="custom-alerts" />
    </div>
  )
}
