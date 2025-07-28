/* Copyright Contributors to the Open Cluster Management project */
import { clusterSets } from '../common/test-data'
import { AmazonHypershiftWizard } from './AmazonHypershiftWizard'

export function AmazonHypershiftWizardExample() {
  return <AmazonHypershiftWizard clusterSets={clusterSets} />
}
