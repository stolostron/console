/* Copyright Contributors to the Open Cluster Management project */

export declare global {
    interface Window {
        acmConsolePluginProxyPath: string
        getEditorValue: any
        //
        propsSnapshot: (props: any, className?: string, max?: number) => void
        recoilSnapshot: (recoil: any, stateName?: string, max?: number) => void
        //
        originalFetch: any
        nockShots: () => void
        getNockLog: (fetches: { url: any; method: any; reqBody: any; resBody?: any }[]) => {
            dataMocks: string[]
            funcMocks: string[]
            actionComments: string[]
        }
        nockSnapshot: any
        capturedFetches: any[]
    }
}
