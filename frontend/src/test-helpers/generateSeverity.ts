/* Copyright Contributors to the Open Cluster Management project */
import { PolicyTemplate } from '../resources/policy'

export function generateSeverity(severity: string): PolicyTemplate {
  return <PolicyTemplate>{
    objectDefinition: {
      spec: {
        severity,
      },
    },
  }
}
