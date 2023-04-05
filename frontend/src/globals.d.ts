/* Copyright Contributors to the Open Cluster Management project */

export declare global {
  interface Window {
    getEditorValue: any
    //
    propShot: (props: any, customFilters?: string[], max?: number) => void
    coilShot: (recoil: any, stateName: string, customFilters?: string[], max?: number) => void
    funcShot: (args: any, ret: any, customFilters?: string[], max?: number) => void
    //
    nockShot: () => void
    getNockShot: (
      fetches: { url: any; method: any; reqBody?: any; resBody?: any }[],
      unfiltered: boolean
    ) => {
      dataMocks: string[]
      funcMocks: string[]
    }
    originalFetch: any
    capturedFetches: any[]
    pendingNocks: any[]
    SERVER_FLAGS: any
  }
}
