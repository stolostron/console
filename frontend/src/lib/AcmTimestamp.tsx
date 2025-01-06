/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { SimpleTimestamp } from './SimpleTimestamp'
import { PluginContext } from './PluginContext'
import { useContext } from 'react'
import { TimestampProps } from '@openshift-console/dynamic-plugin-sdk'

type AcmTimestampProps = TimestampProps & {
  showIcon?: boolean
  relative?: boolean
}

const AcmTimestamp: React.FC<AcmTimestampProps> = ({
  timestamp,
  simple,
  omitSuffix,
  className = '',
  showIcon = false,
  relative = false,
}) => {
  const {
    ocpApi: { Timestamp },
  } = useContext(PluginContext)

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
    <SimpleTimestamp timestamp={timestamp} relative={relative} />
  )
}

export default AcmTimestamp
