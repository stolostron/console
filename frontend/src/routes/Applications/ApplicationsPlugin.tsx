/* Copyright Contributors to the Open Cluster Management project */
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Applications from './Applications'

export default function ApplicationsPlugin() {
    return (
        <PluginContextProvider>
            {/* <LoadData> */}
                <Applications />
            {/* </LoadData> */}
        </PluginContextProvider>
    )

    // return (
    //     <PluginContextProvider>
    //         <PluginData>
    //             <Applications />
    //         </PluginData>
    //     </PluginContextProvider>
    // )
}
