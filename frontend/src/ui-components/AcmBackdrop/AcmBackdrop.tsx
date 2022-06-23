/* Copyright Contributors to the Open Cluster Management project */

import { Backdrop, Bullseye, Spinner } from '@patternfly/react-core'

export function AcmSpinnerBackdrop() {
    return (
        <Backdrop>
            <Bullseye>
                <Spinner />
            </Bullseye>
        </Backdrop>
    )
}
