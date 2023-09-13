/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { Prompt } from 'react-router'
import { useBeforeunload } from 'react-beforeunload'
import isEqual from 'lodash/isEqual'
import { useTranslation } from '../../lib/acm-i18next'
import { useItem } from '@patternfly-labs/react-form-wizard'

export function LostChangesPrompt(props: { data?: any }) {
  const { t } = useTranslation()
  const resources = useItem() // Wizard framework sets this context
  const { data } = props
  const [originalData] = useState(data || resources)
  const dirty = !isEqual(data, originalData)
  useBeforeunload(dirty ? (event) => event.preventDefault() : undefined)
  return <Prompt when={dirty} message={t('changes.maybe.lost')} />
}
