import { Fragment } from 'react'
import { createIcon } from './createAcmIcon'

export const VMWareIcon = createIcon({
    xOffset: 0,
    yOffset: 0,
    width: 384,
    height: 384,
    svgPath: (
        <Fragment>
            <defs>
                <linearGradient id="a" x1="0.2" y1="0.2" x2="0.8" y2="0.8">
                    <stop offset="0" stopColor="#9bca53ff" />
                    <stop offset="1" stopColor="#6d9e3cff" />
                </linearGradient>
            </defs>
            <path
                fill="url(#a)"
                d="M0 144.001C0 117.491 21.49 96 48.001 96h191.998A48.001 48.001 0 01288 144.001v191.998C288 362.51 266.51 384 239.999 384H48.001C21.491 384 0 362.51 0 336z"
            />
            <path
                fill="url(#a)"
                d="M96 48.001C96 21.491 117.49 0 144.001 0h191.998A48.001 48.001 0 01384 48.001v191.998c0 26.51-21.49 48.001-48 48.001H144c-26.509 0-48-21.49-48-48.001z"
            />
            <path
                fill="#fff"
                d="M48 176c0-17.673 14.327-32 32-32h128a32 32 0 0132 32v128c0 17.673-14.327 32-32 32H80c-17.673 0-32-14.327-32-32z"
            />
            <path
                fill="#fff"
                d="M144 80c0-17.673 14.327-32 32-32h128a32 32 0 0132 32v128c0 17.673-14.327 32-32 32H176c-17.673 0-32-14.327-32-32z"
            />
            <defs>
                <linearGradient id="b" x1="0.25" y1="0.25" x2="0.75" y2="0.75">
                    <stop offset="0" stopColor="#ffe599" />
                    <stop offset="1" stopColor="#f1c232" />
                </linearGradient>
            </defs>
            <path
                fill="url(#b)"
                d="M184 106.667C184 96.357 192.358 88 202.667 88h74.666A18.667 18.667 0 01296 106.667v74.666c0 10.31-8.358 18.667-18.667 18.667h-74.666c-10.31 0-18.667-8.358-18.667-18.667z"
            />
            <path
                fill="url(#b)"
                d="M88 202.667C88 192.357 96.358 184 106.667 184h74.666A18.667 18.667 0 01200 202.667v74.666c0 10.31-8.358 18.667-18.667 18.667h-74.666C96.357 296 88 287.642 88 277.333z"
            />
        </Fragment>
    ),
})
export default VMWareIcon
