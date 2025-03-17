/* Copyright Contributors to the Open Cluster Management project */

import { KeyboardEvent, useEffect, useState } from 'react'
import { SyncAltIcon } from '@patternfly/react-icons'
import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core'
import { css } from '@emotion/css'

const DEFAULTS = {
  initPollInterval: 60,
  refreshIntervals: [30, 60, 5 * 60, 30 * 60, 0],
  refreshIntervalCookie: 'acm-page-refresh-interval',
}

export type AcmAutoRefreshSelectProps = {
  refetch: () => void
  pollInterval?: number
  refreshIntervals?: Array<number>
  refreshIntervalCookie?: string
  initPollInterval?: number
}

const container = css({
  display: 'flex',
  alignItems: 'center',
  maxWidth: '225px',
})
const reloadButton = css({
  cursor: 'pointer',
  marginRight: '0.6rem',
})
const buttonTitle = css({
  maxWidth: '200px',
  '& button': {
    paddingLeft: '0',
    paddingRight: '0',
    '& span': {
      fontSize: 'var(--pf-v5-global--FontSize--sm)',
      color: 'var(--pf-v5-global--primary-color--100)',
    },
    '& span:last-of-type': {
      marginRight: '0',
    },
    '&:hover, &:focus': {
      '& span': {
        color: 'var(--pf-v5-global--primary-color--200)',
      },
    },
  },
})
const icon = css({
  maxWidth: '25px',
  color: 'var(--pf-v5-global--primary-color--100)',
})

export const savePollInterval = (refreshIntervalCookie: string, pollInterval: number | string | null) => {
  localStorage.setItem(refreshIntervalCookie, `${pollInterval}`)
}

const useInitializeLocalStorage = (props: AcmAutoRefreshSelectProps) => {
  const initialValue = props.pollInterval
  const key = props.refreshIntervalCookie ?? DEFAULTS.refreshIntervalCookie
  const defaultValue = (props.initPollInterval ?? DEFAULTS.initPollInterval) * 1000

  return useState<number>((): number => {
    if (initialValue != null /* initialValue can be 0 for refresh disabled */) {
      savePollInterval(key, initialValue)
      return initialValue
    } else if (window && window.localStorage && window.localStorage.getItem(key)) {
      /* istanbul ignore next */
      const value = window.localStorage.getItem(key) ?? `${defaultValue}`
      return parseInt(value, 10)
    }
    savePollInterval(key, defaultValue)
    return defaultValue
  })
}

export function AcmAutoRefreshSelect(props: AcmAutoRefreshSelectProps) {
  const [isOpen, setOpen] = useState<boolean>(false)
  const [selected, setStoredValue] = useInitializeLocalStorage(props)
  const [initialFetchCalled, setInitialFetchCalled] = useState<boolean>(false)
  const [docHidden, setDocHidden] = useState<boolean>(window.document.hidden)
  const onVisibilityChange = () => {
    setDocHidden(window.document.hidden)
  }

  const setValue = (value: number) => {
    setStoredValue(value)
    savePollInterval(props.refreshIntervalCookie ?? DEFAULTS.refreshIntervalCookie, value)
  }

  const { refetch } = props

  useEffect(() => {
    refetch()
    setInitialFetchCalled(true)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () => {
      if (!docHidden && selected !== 0) {
        if (initialFetchCalled) {
          // avoid double fetch on the first render
          refetch()
        }
        const interval = setInterval(() => refetch(), selected)
        return () => clearInterval(interval)
      }
      return
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, docHidden] // intentionally exclude initialFetchCalled to avoid double refetch
  )

  const handleKeyPress = (e: KeyboardEvent) => {
    /* istanbul ignore else */
    if (e.key === 'Enter') {
      refetch()
    }
  }

  const autoRefreshChoices = (props.refreshIntervals ?? DEFAULTS.refreshIntervals).map((pi) => {
    let id
    if (pi >= 60) {
      id = `refresh-${pi / 60}m`
    } else if (pi !== 0) {
      id = `refresh-${pi}s`
    } else {
      id = 'refresh-disable'
    }
    pi *= 1000
    return { id, pi }
  })

  const conversion = (pi: number) => {
    if (pi >= 60000) {
      return `Refresh every ${pi / 60000}m`
    } else if (pi !== 0) {
      return `Refresh every ${pi / 1000}s`
    } else {
      return 'Disable refresh'
    }
  }

  return (
    <div className={container}>
      <div
        className={reloadButton}
        tabIndex={0}
        id={'refresh-icon'}
        aria-label={'refresh-icon'}
        role={'button'}
        onClick={() => refetch()}
        onKeyPress={handleKeyPress}
      >
        <SyncAltIcon className={icon} />
      </div>
      <Dropdown
        className={buttonTitle}
        aria-label={'refetch-intervals'}
        id="refresh-dropdown"
        onSelect={() => setOpen(!isOpen)}
        isOpen={isOpen}
        isPlain
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id="refresh-toggle"
            aria-label="refresh-label"
            onClick={() => {
              setOpen(!isOpen)
            }}
            isDisabled={false}
            variant="plain"
            isExpanded={isOpen}
          >
            {conversion(selected)}
          </MenuToggle>
        )}
      >
        <DropdownList>
          {autoRefreshChoices.map((item) => (
            <DropdownItem key={item.id} {...item} onClick={() => setValue(item.pi)}>
              {conversion(item.pi)}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    </div>
  )
}
