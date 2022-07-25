/* Copyright Contributors to the Open Cluster Management project */
export const createHostedClusterMock = {
    apiVersion: 'hypershift.openshift.io/v1alpha1',
    kind: 'HostedCluster',
    metadata: { name: 'test', namespace: 'test' },
    spec: {
        release: { image: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64' },
        pullSecret: { name: 'pullsecret-cluster-test' },
        sshKey: { name: 'sshkey-cluster-test' },
        networking: { podCIDR: '10.132.0.0/14', serviceCIDR: '172.31.0.0/16', machineCIDR: '192.168.122.0/24' },
        platform: { type: 'Agent', agent: { agentNamespace: 'test' } },
        infraID: 'test',
        dns: { baseDomain: 'base.domain.com' },
        services: [
            {
                service: 'APIServer',
                servicePublishingStrategy: { nodePort: { address: 'api.test.base.domain.com' }, type: 'NodePort' },
            },
            { service: 'OAuthServer', servicePublishingStrategy: { type: 'Route' } },
            { service: 'OIDC', servicePublishingStrategy: { type: 'Route' } },
            { service: 'Konnectivity', servicePublishingStrategy: { type: 'Route' } },
            { service: 'Ignition', servicePublishingStrategy: { type: 'Route' } },
        ],
    },
}

export const createPullSecretMock = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'pullsecret-cluster-test',
        namespace: 'test',
        labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
    },
    data: {
        '.dockerconfigjson':
            'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
    },
    type: 'kubernetes.io/dockerconfigjson',
}

export const createPublicSSHKeySecretMock = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'sshkey-cluster-test',
        namespace: 'test',
        labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
    },
    stringData: {
        'id_rsa.pub':
            'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCeJsm56Yn/M+y4gaAa+Nbhffx44JrSq+x6tg4FyTaJEJ/9+/tEH8xzbdXHoNqU5L48Omjyqj6chbm6bvamCo2kVVB0ADfORwGxClInHj9DEW5ionKU0SXx72yt9U0ravCXftWPJgDhvJ0yGrRnApPglCj7OdHDAJGUpw1ZxDitrtsbJFPdNqOUFweimv46NzNe2kyAHwEsmgsnSejDx9BTasvDLwKE3VuK3AGi48s4/NWsbxPrzqtcPHaCXIcI/X29JSPT6E6r5VEinx2DZ5NhpYGB9pxt5dW84UVK6IBnRl469xh0Rkhk3GVVaSmdwJx48iduZWw/LN3N56Tcp561',
    },
}

export const createNodePoolMock = {
    apiVersion: 'hypershift.openshift.io/v1alpha1',
    kind: 'NodePool',
    metadata: { name: 'nodepool-test-1', namespace: 'test' },
    spec: {
        clusterName: 'test',
        replicas: 1,
        management: { autoRepair: false, upgradeType: 'InPlace' },
        platform: { type: 'Agent', agent: { agentLabelSelector: { matchLabels: {} } } },
        release: { image: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64' },
    },
}

export const createMCMock = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { labels: { cloud: 'hypershift', name: 'test' }, name: 'test' },
    spec: { hubAcceptsClient: true },
}

export const createKlusterletMock = {
    apiVersion: 'agent.open-cluster-management.io/v1',
    kind: 'KlusterletAddonConfig',
    metadata: { name: 'test', namespace: 'test' },
    spec: {
        clusterName: 'test',
        clusterNamespace: 'test',
        clusterLabels: { cloud: 'ai-hypershift' },
        applicationManager: { enabled: true },
        policyController: { enabled: true },
        searchCollector: { enabled: true },
        certPolicyController: { enabled: true },
        iamPolicyController: { enabled: true },
    },
}
