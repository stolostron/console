/* Copyright Contributors to the Open Cluster Management project */
import { Fragment, ReactNode } from 'react'
import { useInputHidden } from './Input'

export function WizHidden(props: { children: ReactNode; hidden?: (item: any) => boolean }) {
  const hidden = useInputHidden(props)
  if (hidden) return <Fragment />
  return <Fragment>{props.children}</Fragment>
}

export function WizDetailsHidden(props: { children: ReactNode }) {
  return <Fragment>{props.children}</Fragment>
}
