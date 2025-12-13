/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Spinner } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import AcmTimestamp from '../../lib/AcmTimestamp'

export type AcmRefreshTimeProps = {
  timestamp: string
  reloading?: boolean
}

const timestampClass = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  color: 'var(--pf-t--global--text--color--200)',
  fontSize: '10px',
  lineHeight: '20px',

  '& .pf-v6-c-spinner': {
    marginRight: '.4rem',
  },
})

export const AcmRefreshTime = (props: AcmRefreshTimeProps) => {
  const { reloading, timestamp } = props
  const { t } = useTranslation()
  return (
    <div className={timestampClass}>
      {reloading && <Spinner size="sm" />}
      <p>
        {t('Last update:')} <AcmTimestamp timestamp={timestamp} simple />
      </p>
    </div>
  )
}
