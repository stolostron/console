/* Copyright Contributors to the Open Cluster Management project */
// lint-staged.config.js
module.exports = {
    '*': 'npm run copyright:fix --',
    'backend/**/*.ts': 'npm run lint:fix:backend --',
    'frontend/**/*.{ts,tsx}|frontend/src/**/*.{js,jsx}': (staged) => {
        const files = staged.join(' ')
        return [
            `npm run lint:fix:frontend -- ${files}`,
            `npm run i18n:frontend`,
        ]
    },
}
