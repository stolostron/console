/* Copyright Contributors to the Open Cluster Management project */
// lint-staged.config.js
module.exports = {
    '*': 'npm run copyright:fix --',
    'backend/**/*.ts': 'npm run lint:fix:backend --',
    'frontend/**/*.{js,jsx,ts,tsx}': (staged) => {
        const files = staged.join(' ')
        return [
            `npm run lint:fix:frontend -- ${files}`,
            `npm run i18n:frontend -- ${files}`,
            'git diff --exit-code frontend/public/locales/en/translation.json',
        ]
    },
}
