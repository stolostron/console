/* Copyright Contributors to the Open Cluster Management project */
export const randomHex = () =>
    `${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padEnd(6, '0')}`
