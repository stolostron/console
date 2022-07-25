/* Copyright Contributors to the Open Cluster Management project */
import { cloneDeep } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import {
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
    ConfigMap,
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../../../../resources'

export const clusterName = 'test'
export const baseDomain = 'base.domain.com'
export const pullSecretAI = '{"auths":{"cloud.openshift.com":{"auth":"b3BlbSKIPPED","email":"my@email.somewhere.com"}}}'
export const publicSSHKey =
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCeJsm56Yn/M+y4gaAa+Nbhffx44JrSq+x6tg4FyTaJEJ/9+/tEH8xzbdXHoNqU5L48Omjyqj6chbm6bvamCo2kVVB0ADfORwGxClInHj9DEW5ionKU0SXx72yt9U0ravCXftWPJgDhvJ0yGrRnApPglCj7OdHDAJGUpw1ZxDitrtsbJFPdNqOUFweimv46NzNe2kyAHwEsmgsnSejDx9BTasvDLwKE3VuK3AGi48s4/NWsbxPrzqtcPHaCXIcI/X29JSPT6E6r5VEinx2DZ5NhpYGB9pxt5dW84UVK6IBnRl469xh0Rkhk3GVVaSmdwJx48iduZWw/LN3N56Tcp561'

export const mockClusterProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: clusterName },
}

export const mockClusterProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: clusterName,
    },
}

export const mockConfigMapAI: ConfigMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
        name: 'assisted-service-config',
        namespace: 'assisted-installer',
    },
    data: {},
}

export const mockClusterDeploymentAI: CIM.ClusterDeploymentK8sResource = {
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: {
        annotations: {
            'agentBareMetal-agentSelector/autoSelect': 'true',
        },
        labels: null,
        name: clusterName,
        namespace: clusterName,
    },
    spec: {
        baseDomain,
        clusterInstallRef: {
            group: 'extensions.hive.openshift.io',
            kind: 'AgentClusterInstall',
            name: clusterName,
            version: 'v1beta1',
        },
        clusterName,
        platform: {
            agentBareMetal: {
                agentSelector: {
                    matchLabels: null,
                },
            },
        },
        pullSecretRef: {
            name: 'pullsecret-cluster-test',
        },
    },
}

export const mockAgentClusterInstall: CIM.AgentClusterInstallK8sResource = {
    apiVersion: 'extensions.hive.openshift.io/v1beta1',
    kind: 'AgentClusterInstall',
    metadata: { name: 'test', namespace: 'test' },
    spec: {
        clusterDeploymentRef: { name: 'test' },
        holdInstallation: true,
        provisionRequirements: { workerAgents: 0, controlPlaneAgents: 3 },
        imageSetRef: { name: 'ocp-release48' },
        networking: {
            clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
            serviceNetwork: ['172.30.0.0/16'],
        },
    },
}

const mockAgent = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'Agent',
    metadata: {
        labels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
            'infraenvs.agent-install.openshift.io': clusterName,
        },
        name: '0f093a00-5df8-40d7-840f-bca56216471',
        namespace: clusterName,
        uid: '0f093a00-5df8-40d7-840f-bca56216471_',
    },
    spec: {
        approved: true,
        hostname: 'host',
        role: '',
    },
    status: {
        conditions: [],
        debugInfo: {
            state: 'known',
            stateInfo: '',
        },
        inventory: {
            interfaces: [{ ipV4Addresses: ['192.168.122.27/24'] }],
        },
        ntpSources: [],
        progress: {},
        role: 'auto-assign',
    },
}

export const mockAgents = Array.from({ length: 5 }, (_val, index) => {
    const mockedAgent = cloneDeep(mockAgent)
    mockedAgent.metadata.name = `${mockedAgent.metadata.name}${index}`
    mockedAgent.metadata.uid = mockedAgent.metadata.name
    mockedAgent.spec.hostname = `${mockedAgent.spec.hostname}-${index}`
    return mockedAgent
})

export const clusterImageSet: CIM.ClusterImageSetK8sResource = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'ocp-release48',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64',
    },
}
export const mockClusterImageSet = [clusterImageSet]

export const mockTestInfraWithAgents: CIM.InfraEnvK8sResource = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        name: 'test',
        namespace: 'test',
    },
    spec: {},
    status: {
        agentLabelSelector: {
            matchLabels: {
                'infraenvs.agent-install.openshift.io': 'test',
            },
        },
    },
}

export const mockTestInfraNoAgents: CIM.InfraEnvK8sResource = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        name: 'noagents',
        namespace: 'noagents',
    },
    spec: {},
    status: {
        agentLabelSelector: {
            matchLabels: {
                'infraenvs.agent-install.openshift.io': 'noagents',
            },
        },
    },
}

export const mockAgent2 = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'Agent',
    metadata: {
        labels: {
            'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
            'infraenvs.agent-install.openshift.io': 'test2',
        },
        name: '0f093a00-5df8-40d7-840f-bca56216471',
        namespace: 'test2',
        uid: '0f093a00-5df8-40d7-840f-bca56216471_',
    },
    spec: {
        approved: true,
        hostname: 'host',
        role: '',
    },
    status: {
        conditions: [],
        debugInfo: {
            state: 'known',
            stateInfo: '',
        },
        inventory: {},
        ntpSources: [],
        progress: {},
        role: 'auto-assign',
    },
}

export const mockTestInfraWithAgents2: CIM.InfraEnvK8sResource = {
    apiVersion: 'agent-install.openshift.io/v1beta1',
    kind: 'InfraEnv',
    metadata: {
        name: 'test2',
        namespace: 'test2',
    },
    spec: {},
    status: {
        agentLabelSelector: {
            matchLabels: {
                'infraenvs.agent-install.openshift.io': 'test2',
            },
        },
    },
}
