/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonVariant, Checkbox } from '@patternfly/react-core'
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmLabels } from '../../AcmLabels'

export function AcmExpandableCheckbox(props: {
  label: string
  children: ReactNode
  expanded: boolean
  checked: boolean | null
  onToggle: (expanded: boolean) => void
  onCheck: (checked: boolean | null) => void
  additionalLabels?: string[] | Record<string, string>
  isDisabled?: boolean
  expandable?: boolean
  id?: string
}) {
  const { t } = useTranslation()
  return (
    <div>
      <Button
        aria-label={t('Expand')}
        variant={ButtonVariant.plain}
        id={`${props.id}-toggle` || ''}
        style={{
          border: '0px',
          visibility: props.expandable ? 'visible' : 'hidden',
          paddingLeft: '6px',
          paddingRight: '6px',
        }}
        onClick={() => props.onToggle(props.expanded)}
      >
        {!props.expanded && <AngleRightIcon />}
        {props.expanded && <AngleDownIcon />}
      </Button>
      <span style={{ paddingRight: '10px' }}>
        <Checkbox
          isChecked={props.checked}
          id={`${props.id}-checkbox` || ''}
          name={`${props.id}-checkbox` || ''}
          onChange={() => props.onCheck(props.checked)}
          isDisabled={props.isDisabled}
        />
      </span>
      {props.label}
      {props.additionalLabels && (
        <span style={{ paddingLeft: '10px' }}>
          <AcmLabels labels={props.additionalLabels} />
        </span>
      )}
      <div hidden={!props.expanded}>{props.children}</div>
    </div>
  )
}
