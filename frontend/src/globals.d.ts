/* Copyright Contributors to the Open Cluster Management project */

export declare global {
    interface Window {
        acmConsolePluginProxyPath: string
        getEditorValue: any
        //
        propShot: (props: any, className?: string, max?: number) => void
        coilShot: (recoil: any, stateName?: string, max?: number) => void
        //
        nockShot: () => void
        getNockShot: (fetches: { url: any; method: any; reqBody?: any; resBody?: any }[]) => {
            dataMocks: string[]
            funcMocks: string[]
        }
        originalFetch: any
        capturedFetches: any[]
    }
}
