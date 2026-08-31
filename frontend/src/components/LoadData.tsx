/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode } from 'react'
import { LoadEventsData } from './LoadEventsData'
import { LoadRbacData } from './LoadRbacData'

/**
 * Composition root for backend event streams.
 * One business domain → one GET /events/<domain> → one LoadXxxData → one line here.
 */
export function LoadData(props: { children?: ReactNode }) {
  return (
    <>
      <LoadEventsData />
      <LoadRbacData />
      {props.children}
    </>
  )
}
