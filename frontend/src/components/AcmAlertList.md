# AcmAlertList Component

A reusable ACM component that wraps PatternFly's `Alert` component to render multiple alerts from an array configuration.

## Overview

`AcmAlertList` simplifies the rendering of multiple alerts by accepting an array of alert configurations. Each alert in the array supports all standard PatternFly `AlertProps`, making it flexible and fully compatible with PatternFly's Alert API.

## Installation

Import the component from the components directory:

```typescript
import { AcmAlertList, AcmAlertListItem } from '../components/AcmAlertList'
```

## Props

### AcmAlertListProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `alerts` | `AcmAlertListItem[]` | **Required** | Array of alert configurations to render |
| `isInline` | `boolean` | `false` | Render alerts as inline alerts |
| `isToast` | `boolean` | `false` | Render alerts in a toast-style AlertGroup |
| `isLiveRegion` | `boolean` | `false` | Enable live region for accessibility |
| `style` | `React.CSSProperties` | `undefined` | Custom styles for the AlertGroup container |
| `className` | `string` | `undefined` | Custom className for the AlertGroup container |

### AcmAlertListItem

Extends PatternFly's `AlertProps` with a required `key` property:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | **Yes** | Unique identifier for the alert |
| `variant` | `'success' \| 'danger' \| 'warning' \| 'info' \| 'custom'` | No | Alert variant/type |
| `title` | `ReactNode` | **Yes** | Alert title |
| `children` | `ReactNode` | No | Alert content/message |
| `actionClose` | `boolean \| ReactElement` | No | Close button configuration |
| `actionLinks` | `ReactElement` | No | Action links to display |
| `isExpandable` | `boolean` | No | Make alert expandable |
| `...otherProps` | `AlertProps` | No | All other PatternFly Alert props |

## Usage Examples

### Basic Usage

```typescript
import { AcmAlertList, AcmAlertListItem } from './AcmAlertList'

function MyComponent() {
  const alerts: AcmAlertListItem[] = [
    {
      key: 'success-1',
      variant: 'success',
      title: 'Cluster created successfully',
      children: 'Your new cluster is ready to use.',
    },
    {
      key: 'warning-1',
      variant: 'warning',
      title: 'Storage limit approaching',
      children: 'You are using 85% of your allocated storage.',
    },
  ]

  return <AcmAlertList alerts={alerts} />
}
```

### Inline Alerts

```typescript
<AcmAlertList alerts={alerts} isInline />
```

### Toast Alerts with Live Region

```typescript
<AcmAlertList alerts={alerts} isToast isLiveRegion />
```

### Alerts with Actions

```typescript
import { Button } from '@patternfly/react-core'

const alerts: AcmAlertListItem[] = [
  {
    key: 'info-1',
    variant: 'info',
    title: 'System maintenance scheduled',
    children: 'Maintenance window: February 20, 2026, 2:00 AM - 4:00 AM UTC',
    actionLinks: (
      <Button variant="link" isInline onClick={() => console.log('Learn more')}>
        Learn more
      </Button>
    ),
  },
]

return <AcmAlertList alerts={alerts} isInline />
```

### Expandable Alerts

```typescript
const alerts: AcmAlertListItem[] = [
  {
    key: 'danger-1',
    variant: 'danger',
    title: 'Connection failed',
    isExpandable: true,
    children: (
      <>
        <p>Unable to connect to the managed cluster.</p>
        <p>Error details: Connection timeout after 30 seconds.</p>
        <p>Please verify network connectivity and firewall rules.</p>
      </>
    ),
  },
]

return <AcmAlertList alerts={alerts} />
```

### Custom Styling

```typescript
<AcmAlertList
  alerts={alerts}
  isInline
  className="my-custom-alerts"
  style={{ marginTop: '2rem', padding: '1rem' }}
/>
```

### Dynamic Alerts

```typescript
import { useState } from 'react'
import { AcmAlertList, AcmAlertListItem } from './AcmAlertList'

function DynamicAlertsExample() {
  const [alerts, setAlerts] = useState<AcmAlertListItem[]>([])

  const addAlert = (message: string, variant: 'success' | 'danger' | 'warning' | 'info') => {
    const newAlert: AcmAlertListItem = {
      key: `alert-${Date.now()}`,
      variant,
      title: message,
      actionClose: true,
    }
    setAlerts(prev => [...prev, newAlert])
  }

  const removeAlert = (key: string) => {
    setAlerts(prev => prev.filter(alert => alert.key !== key))
  }

  return (
    <>
      <button onClick={() => addAlert('Success!', 'success')}>Add Success Alert</button>
      <AcmAlertList
        alerts={alerts.map(alert => ({
          ...alert,
          onClose: () => removeAlert(alert.key),
        }))}
        isInline
      />
    </>
  )
}
```

## Accessibility

- Use `isLiveRegion={true}` for dynamic alerts that should be announced to screen readers
- Ensure alert titles are descriptive and meaningful
- Provide clear action button labels

## Best Practices

1. **Unique Keys**: Always provide unique `key` values for each alert
2. **Meaningful Titles**: Use clear, concise titles that describe the alert purpose
3. **Appropriate Variants**: Use the correct variant for the message type:
   - `success`: Successful operations
   - `info`: Informational messages
   - `warning`: Warnings that require attention
   - `danger`: Errors or critical issues
4. **Closeable Alerts**: For non-critical alerts, consider allowing users to dismiss them with `actionClose`
5. **Action Links**: Provide clear next steps when applicable

## Related Components

- `AcmAlert` - Single alert with context provider support
- `AcmAlertGroup` - Alert group with context provider
- `SearchAlertGroup` - Search-specific alert grouping

## PatternFly Documentation

For more information about PatternFly Alert props and options, see:
- [PatternFly Alert Documentation](https://www.patternfly.org/components/alert)
