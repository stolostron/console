// /* Copyright Contributors to the Open Cluster Management project */
import { LAST_LANGUAGE_LOCAL_STORAGE_KEY } from './const'

export const getLastLanguage = (): string => localStorage.getItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY) ?? navigator.language
console.log('GET LAST LANG : :', getLastLanguage())
