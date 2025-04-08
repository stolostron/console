/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { SelectOption } from '@patternfly/react-core'
import { useState } from 'react'
import { AcmSelect } from '../AcmSelect/AcmSelect'

type AcmLogWindowProps = {
  id: string
  cluster: string
  namespace: string
  initialContainer: string
  // Callback to get new container to query logs from
  onSwitchContainer: (newContainer: string | undefined) => void
  containers: string[]
  // A single string that contains \n for each new log line
  logs: string
}

const containerSelect = css({
  width: 'auto',
  'min-width': 'min-content',
  'max-width': 'max-content',
})
const logWindow = css({
  color: 'var(--pf-v5-global--palette--black-150)',
  backgroundColor: 'var(--pf-v5-global--palette--black-1000)',
})
const logWindowHeader = css({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--pf-v5-global--palette--black-900)',
  marginTop: '1rem',
})
const logWindowHeaderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: '36px',
  backgroundColor: 'var(--pf-v5-global--palette--black-900)',
  padding: '8px 10px 5px 10px',
  borderRight: '1px solid #4f5255',
})
const logWindowHeaderItemLabel = css({
  paddingRight: '.5rem',
})
const logWindowBody = css({
  backgroundColor: 'var(--pf-v5-global--palette--black-1000)',
  fontFamily: 'Menlo,Monaco,Consolas,monospace',
})
const logWindowScrollPane = css({
  overflow: 'auto',
  paddingTop: '10px',
})
const logWindowContents = css({
  height: '500px',
})
const logWindowLines = css({
  paddingLeft: '10px',
  paddingRight: '10px',
  whiteSpace: 'pre',
  width: 0,
})

export function AcmLogWindow(props: AcmLogWindowProps) {
  const { cluster, namespace, initialContainer, containers, onSwitchContainer, logs } = props
  const [selectedContainer, setSelectedContainer] = useState<string | undefined>(initialContainer)

  return (
    <div>
      <AcmSelect
        id={'container-select'}
        label={''}
        className={containerSelect}
        value={selectedContainer}
        onChange={(value) => {
          setSelectedContainer(value)
          onSwitchContainer(value)
        }}
      >
        {containers.map((container) => {
          return (
            <SelectOption key={container} value={container}>
              {container}
            </SelectOption>
          )
        })}
      </AcmSelect>
      <div className={logWindow}>
        <div className={logWindowHeader}>
          <div className={logWindowHeaderItem}>
            <p className={logWindowHeaderItemLabel}>{'Cluster:'}</p>
            {cluster}
          </div>
          <div className={logWindowHeaderItem}>
            <p className={logWindowHeaderItemLabel}>{'Namespace:'}</p>
            {namespace}
          </div>
        </div>
        <div className={logWindowBody}>
          <div className={logWindowScrollPane}>
            <div className={logWindowContents}>
              <div id={'log-window-lines-container'} className={logWindowLines}>
                {logs}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
