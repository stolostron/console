/* Copyright Contributors to the Open Cluster Management project */
'use strict'

/**
 * Partition a flat group controlData array into { title, content } sections.
 * Handles `pauseControlCreationHereUntilSelected` by skipping subsequent
 * controls when the gate control has no active value, and tags each
 * non-section control with `grpNum` for downstream consumers.
 */
export const partitionGroupSections = (controlData = [], grpNum = 0) => {
  let section
  let content = []
  let stopRendering = false
  let stopRenderingOnNextControl = false
  const controlSections = []
  controlData.forEach((control) => {
    const { type, pauseControlCreationHereUntilSelected } = control
    stopRendering = stopRenderingOnNextControl
    if (pauseControlCreationHereUntilSelected) {
      stopRenderingOnNextControl = !control.active
    }
    if (!stopRendering) {
      control.grpNum = grpNum
      if (type === 'section') {
        content = []
        section = { title: control, content }
        controlSections.push(section)
      } else {
        content.push(control)
      }
    }
  })
  return controlSections
}
