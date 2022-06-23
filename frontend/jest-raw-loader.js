/* Copyright Contributors to the Open Cluster Management project */
// jest-raw-loader compatibility with Jest version 28.
// See: https://github.com/keplersj/jest-raw-loader/pull/239
module.exports = {
    process: (content) => {
        return {
            code: 'module.exports = ' + JSON.stringify(content),
        }
    },
}
