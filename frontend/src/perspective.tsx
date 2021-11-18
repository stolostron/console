/* Copyright Contributors to the Open Cluster Management project */

import { CSSProperties } from 'react'

function ACMIcon() {
    const acmIconStyle: CSSProperties = {
        height: '14px',
        fill: 'currentColor',
    }
    return (
        <svg viewBox="0 0 14 13.97" style={acmIconStyle}>
            <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path d="M12.63,6A1.5,1.5,0,1,0,11,4.51l-1.54.91a2.94,2.94,0,0,0-1.85-1L7.35,2.66a1.52,1.52,0,0,0,.49-.72,1.5,1.5,0,0,0-1-1.87A1.49,1.49,0,0,0,5,1.06a1.51,1.51,0,0,0,.88,1.83L6.12,4.6A2.9,2.9,0,0,0,4.5,6.29L2.88,6.07a1.52,1.52,0,0,0-.55-.68,1.51,1.51,0,0,0-2.08.43A1.49,1.49,0,0,0,2.67,7.56l1.68.23A3,3,0,0,0,5.41,9.6L4.8,11a1.5,1.5,0,1,0,1.14,2.63,1.49,1.49,0,0,0,.24-2l.61-1.39a3.44,3.44,0,0,0,.45,0,2.92,2.92,0,0,0,1.6-.48L10.21,11a1.45,1.45,0,0,0,.09.87,1.5,1.5,0,1,0,.91-2L9.85,8.66a3,3,0,0,0,.33-1.34,3.1,3.1,0,0,0,0-.54l1.64-1A1.47,1.47,0,0,0,12.63,6ZM5.48,7.32A1.77,1.77,0,1,1,7.24,9.08,1.76,1.76,0,0,1,5.48,7.32Z" />
                </g>
            </g>
        </svg>
    )
}

export const icon = { default: ACMIcon }

export const getLandingPageURL = () => '/multicloud/home/welcome'

export const getImportRedirectURL = (namespace: string) => `/k8s/cluster/projects/${namespace}/workloads`
