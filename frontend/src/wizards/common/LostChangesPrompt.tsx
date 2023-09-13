/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { Prompt } from 'react-router'
import { useBeforeunload } from 'react-beforeunload'
import isEqual from 'lodash/isEqual'
import { useTranslation } from '../../lib/acm-i18next'
import { useItem } from '@patternfly-labs/react-form-wizard'

export function LostChangesPrompt(props: { initialData?: any; data?: any }) {
  const { t } = useTranslation()
  const resources = useItem()
  const { data = resources, initialData } = props
  const [originalData] = useState(initialData || data)
  const dirty = !isEqual(data, originalData)
  useBeforeunload(dirty ? (event) => event.preventDefault() : undefined)
  return <Prompt when={dirty} message={t('changes.maybe.lost')} />
}
