/* Copyright Contributors to the Open Cluster Management project */
export const argoAppSetQueryString = '?' + 'apiVersion=applicationset.argoproj.io'.replace(/\./g, '%2E')

export const subscriptionAppQueryString = '?' + 'apiVersion=application.app.k8s.io'.replace(/\./g, '%2E')
