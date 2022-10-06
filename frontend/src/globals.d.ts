/* Copyright Contributors to the Open Cluster Management project */

export declare global {
    interface Window {
        acmConsolePluginProxyPath: string
        getEditorValue: any
        propsSnapshot: any
        recoilSnapshot: any
        missingNock:
            | {
                  [index: string]: {
                      method?: string
                      nockedBody?: any
                      requestedBody?: any
                      options?: any
                  }
              }
            | undefined
    }
}
