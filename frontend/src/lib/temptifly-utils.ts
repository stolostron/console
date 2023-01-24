/* Copyright Contributors to the Open Cluster Management project */

export function getControlByID(controlData: { id: string }[], id: string): any | undefined {
  return controlData.find(({ id: identifier }) => identifier === id)
}
