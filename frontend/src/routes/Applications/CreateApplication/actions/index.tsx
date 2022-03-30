/* Copyright Contributors to the Open Cluster Management project */
export const argoAppSetQueryString = '?' + encodeURIComponent('apiVersion=applicationset.argoproj.io')

export const subscriptionAppQueryString = '?' + 'apiVersion=application.app.k8s.io'.replace(/\./g, '%2E')
