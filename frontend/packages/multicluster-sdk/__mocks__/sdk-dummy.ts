/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
export class Dummy extends Error {
  constructor() {
    super('Dummy file for exports')
  }
}

export function useResolvedExtensions(): any[] {
  return [undefined, undefined, undefined]
}
