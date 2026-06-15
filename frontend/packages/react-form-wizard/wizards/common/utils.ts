/* Copyright Contributors to the Open Cluster Management project */
import { RouteE } from '../Routes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function onSubmit(_data: unknown) {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // alert(JSON.stringify(data, null, 2))
  return Promise.reject(new Error('No backend connected'))
}

export function onCancel(navigate: (path: string) => void) {
  navigate(`./${RouteE.Wizards}`)
}
