/* Copyright Contributors to the Open Cluster Management project */

import { AcmCodeSnippet } from './AcmCodeSnippet'
import { AcmPageCard } from '../AcmPage/AcmPage'

export default {
    title: 'CodeSnippet',
    component: AcmCodeSnippet,
}

export const CodeSnippet = () => {
    return (
        <AcmPageCard>
            <AcmCodeSnippet
                id="snippet"
                fakeCommand="fake command"
                command="real command"
                copyTooltipText="Copy to clipboard"
                copySuccessText="Copied!"
            />
        </AcmPageCard>
    )
}
