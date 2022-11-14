/* Copyright Contributors to the Open Cluster Management project */
import { getDefaultNetworkFormValues } from './NetworkForm'

const templateYAML = `
apiVersion: hypershift.openshift.io/v1alpha1
kind: HostedCluster
metadata:
  name: test-cluster-name
  namespace: test-cluster-name
  labels:
spec:
  release:
    image: test-image
  pullSecret:
    name: pullsecret-cluster-test-cluster-name
  sshKey:
    name: sshkey-cluster-test-cluster-name
  networking:
    podCIDR: 1.2.3.4/18
    serviceCIDR: 4.5.6.7/16
    machineCIDR: 2.4.6.8/12
  configuration:
    items:
    - apiVersion: config.openshift.io/v1
      kind: Proxy
      spec:
        XXXhttpProxy: http://user:pwd@2.3.4.5:123
        httpsProxy: https://user:pwd@6.7.8.9:456
        noProxy: 'noprxy.com,3.4.5.6'
  services:
  - service: APIServer
    servicePublishingStrategy:
      type: 
      nodePort:
        address: 4.5.6.7
        port: 12
  - service: OAuthServer
    servicePublishingStrategy:
      type: Route
  - service: OIDC
    servicePublishingStrategy:
      type: Route
  - service: Konnectivity
    servicePublishingStrategy:
      type: Route
  - service: Ignition
    servicePublishingStrategy:
      type: Route
`

describe('NetworkForm', () => {
    test('it sets default form values', () => {
        const initialValues = getDefaultNetworkFormValues(templateYAML, true, false)
        expect(initialValues).toMatchSnapshot()
    })
})
