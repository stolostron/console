/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { SimpleTimestamp } from './SimpleTimestamp'
import { PluginContext } from './PluginContext'
import { useContext } from 'react'
import { TimestampProps } from '@openshift-console/dynamic-plugin-sdk'

type AcmTimestampProps = Omit<TimestampProps, 'timestamp'> & {
  showIcon?: boolean
  noDateText?: string
  timestamp: TimestampProps['timestamp'] | undefined
}

/**
 * A unified timestamp component that integrates with OpenShift Console.
 *
 * @component
 * @description
 * AcmTimestamp provides timestamp display functionality that adapts to its context:
 * - In OpenShift Console: Uses the native OpenShift Timestamp component
 * - In standalone environments: Falls back to SimpleTimestamp component
 *
 * The component supports all OpenShift timestamp formatting options plus additional
 * features like icon visibility control and custom fallback text.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AcmTimestamp timestamp="2024-02-26T12:00:00Z" />
 *
 * // With all options
 * <AcmTimestamp
 *   timestamp="2024-02-26T12:00:00Z"
 *   simple={true}
 *   omitSuffix={true}
 *   showIcon={false}
 *   className="custom-timestamp"
 *   noDateText="No date available"
 * />
 * ```
 *
 * @property {string | undefined} timestamp - ISO 8601 formatted timestamp to display
 * @property {string} [noDateText='-'] - Text shown when timestamp is undefined
 * @property {boolean} [simple] - Use simplified timestamp format (OpenShift only)
 * @property {boolean} [omitSuffix] - Remove the "ago" suffix (OpenShift only)
 * @property {string} [className=''] - Additional CSS classes
 * @property {boolean} [showIcon=false] - Show/hide timestamp icon (OpenShift only)
 *
 * @returns {React.ReactNode} The rendered timestamp or fallback text
 *
 * @remarks
 * Key Features:
 * 1. OpenShift Integration
 *    - Uses OpenShift's `<Timestamp />` component when available
 *    - Inherits all OpenShift timestamp formatting capabilities
 * 2. Fallback Mode
 *    - Uses `<SimpleTimestamp />` when not in OpenShift context
 *    - Maintains consistent timestamp display in standalone mode
 */

const AcmTimestamp: React.FC<AcmTimestampProps> = ({
  timestamp,
  noDateText = '-',
  simple,
  omitSuffix,
  className = '',
  showIcon = false,
}: AcmTimestampProps) => {
  const {
    ocpApi: { Timestamp },
  } = useContext(PluginContext)

  if (!timestamp) {
    return noDateText
  }

  return Timestamp ? (
    <Timestamp
      timestamp={timestamp}
      simple={simple}
      omitSuffix={omitSuffix}
      className={`${className}${
        !showIcon
          ? ` ${css({
              '.co-icon-and-text__icon': {
                display: 'none',
              },
            })}`
          : ''
      }`}
    />
  ) : (
    <SimpleTimestamp timestamp={timestamp} />
  )
}

export default AcmTimestamp
