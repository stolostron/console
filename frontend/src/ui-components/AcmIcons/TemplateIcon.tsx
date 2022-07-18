/* Copyright Contributors to the Open Cluster Management project */

import { createAcmIcon } from './createAcmIcon'

export const AcmTemplateIcon = createAcmIcon({
    xOffset: 0,
    yOffset: 0,
    width: 32,
    height: 32,
    svgPaths: (
        <g fill="none">
            <circle fill="#06C" cx="16" cy="16" r="16" />
            <g fill="#FFF">
                <path d="M17.829 8.686l3.657 3.657V22.4c0 .505-.41.914-.915.914H11.43a.914.914 0 01-.915-.914V9.6c0-.505.41-.914.915-.914h6.4zm-.907.914H11.43v12.8h9.142v-9.146l-2.709-.008a.914.914 0 01-.911-.905L16.922 9.6zm.92.392l.023 2.34 2.324.007-2.348-2.347z" />
                <path d="M13.257 16.915h5.486v1h-5.486zM13.257 19.657h5.486v1h-5.486z" />
            </g>
        </g>
    ),
})

export default AcmTemplateIcon
