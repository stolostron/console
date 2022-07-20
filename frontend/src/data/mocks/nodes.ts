/* Copyright Contributors to the Open Cluster Management project */
export const nodes = [
    {
        apiVersion: 'v1',
        kind: 'Node',
        metadata: {
            annotations: {
                'cloud.network.openshift.io/egress-ipconfig':
                    '[{"interface":"eni-0ea5a39d571358a91","ifaddr":{"ipv4":"10.0.128.0/20"},"capacity":{"ipv4":14,"ipv6":15}}]',
                'csi.volume.kubernetes.io/nodeid':
                    '{"csi.sharedresource.openshift.io":"ip-10-0-128-71.ec2.internal","ebs.csi.aws.com":"i-0daf8c7e6b7963410"}',
                'machine.openshift.io/machine': 'openshift-machine-api/cs-aws-411-b25nm-89t8l-master-0',
                'machineconfiguration.openshift.io/controlPlaneTopology': 'HighlyAvailable',
                'machineconfiguration.openshift.io/currentConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/lastAppliedDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/reason': '',
                'machineconfiguration.openshift.io/state': 'Done',
                'volumes.kubernetes.io/controller-managed-attach-detach': 'true',
            },
            labels: {
                'beta.kubernetes.io/arch': 'amd64',
                'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                'beta.kubernetes.io/os': 'linux',
                'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                'kubernetes.io/arch': 'amd64',
                'kubernetes.io/hostname': 'ip-10-0-128-71.ec2.internal',
                'kubernetes.io/os': 'linux',
                'node-role.kubernetes.io/master': '',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                'node.openshift.io/os_id': 'rhcos',
                'topology.csidriver.csi/node': 'ip-10-0-128-71.ec2.internal',
                'topology.ebs.csi.aws.com/zone': 'us-east-1b',
                'topology.kubernetes.io/region': 'us-east-1',
                'topology.kubernetes.io/zone': 'us-east-1b',
            },
            name: 'ip-10-0-128-71.ec2.internal',
        },
        spec: {
            providerID: 'aws:///us-east-1b/i-0daf8c7e6b7963410',
        },
        status: {
            addresses: [
                {
                    address: '10.0.128.71',
                    type: 'InternalIP',
                },
                {
                    address: 'ip-10-0-128-71.ec2.internal',
                    type: 'Hostname',
                },
                {
                    address: 'ip-10-0-128-71.ec2.internal',
                    type: 'InternalDNS',
                },
            ],
            allocatable: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '7500m',
                'ephemeral-storage': '96143180846',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '31060468Ki',
                pods: '250',
            },
            capacity: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '8',
                'ephemeral-storage': '104322028Ki',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '32211444Ki',
                pods: '250',
            },
            conditions: [
                {
                    lastHeartbeatTime: '2022-07-19T18:43:59Z',
                    lastTransitionTime: '2022-07-19T11:37:48Z',
                    message: 'kubelet has sufficient memory available',
                    reason: 'KubeletHasSufficientMemory',
                    status: 'False',
                    type: 'MemoryPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:43:59Z',
                    lastTransitionTime: '2022-07-19T11:37:48Z',
                    message: 'kubelet has no disk pressure',
                    reason: 'KubeletHasNoDiskPressure',
                    status: 'False',
                    type: 'DiskPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:43:59Z',
                    lastTransitionTime: '2022-07-19T11:37:48Z',
                    message: 'kubelet has sufficient PID available',
                    reason: 'KubeletHasSufficientPID',
                    status: 'False',
                    type: 'PIDPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:43:59Z',
                    lastTransitionTime: '2022-07-19T11:37:58Z',
                    message: 'kubelet is posting ready status',
                    reason: 'KubeletReady',
                    status: 'True',
                    type: 'Ready',
                },
            ],
            daemonEndpoints: {
                kubeletEndpoint: {
                    Port: 10250,
                },
            },
            images: [
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5b84720b30885d36d76d18491948e4f5bec55afdbe3df8b6354f3bb7c965ca3d',
                    ],
                    sizeBytes: 1294514783,
                },
                {
                    names: [
                        'quay.io/stolostron/hive@sha256:27d71e4181a4a08018460a25f98692ddc48ffccf244fc0a7e60c5a8cbc17032b',
                    ],
                    sizeBytes: 1057197885,
                },
                {
                    names: [
                        'quay.io/stolostron/assisted-service@sha256:4a7048cd45ef5c6437699f21e9eb66649dc328451177a7649b2e715081caf810',
                    ],
                    sizeBytes: 878487204,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:876d023dcd0f7a23f791c8e5e990e8c3413b5c55a153a806743977b5041b9a45',
                    ],
                    sizeBytes: 866533954,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:2130761a5142145544302d275af6aca9a08349c6baf66d98be9d35b334d9d23c',
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:43833fe67332f28bc441aa78dbb09928e369019bf92c694ac4dd1494966a1782',
                        'registry.redhat.io/redhat/redhat-operator-index:v4.11',
                    ],
                    sizeBytes: 866533940,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:713cb8029f42d10dc584a272e459ab54d91f640db61d2d9315cb00b9daf3eddd',
                    ],
                    sizeBytes: 864463412,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ec270d19aa0983e7eebe4c545daf8a3d657def92965d330f1b28aa5c6743a9a2',
                    ],
                    sizeBytes: 823541404,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/certified-operator-index@sha256:639ff227f7750695a568ee1962edb7b8369dc9544c6c09f3aac961cac8e712cd',
                        'registry.redhat.io/redhat/certified-operator-index@sha256:9f6ca8286261db9f44e807f20fbc1e31f648c7629c0a3ce4e1db8fc7c2e0838b',
                        'registry.redhat.io/redhat/certified-operator-index:v4.11',
                    ],
                    sizeBytes: 752245473,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ab1582971a495722eb1f15ab234849026db159e6867a9f49b98f03820b6e5d28',
                    ],
                    sizeBytes: 733144740,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-marketplace-index@sha256:e4126951822c8f812e216bfe0124ef50b69e61a21196ad78a1ccd6f05d358ac3',
                        'registry.redhat.io/redhat/redhat-marketplace-index@sha256:ea1aa4140c5cfa6a66b1cc3e2d08a6d7c480e2b5bc6f17901f8f0c8e46dc1e23',
                        'registry.redhat.io/redhat/redhat-marketplace-index:v4.11',
                    ],
                    sizeBytes: 719788252,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fd41c91d1b78045023a3ba8963ab15104ea31a6c695a750872c80489c2d156f2',
                    ],
                    sizeBytes: 681947258,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:aa83a4173d3c98b819c59089bd1a765a51541f8ae035f3b16b7945b657be2383',
                    ],
                    sizeBytes: 612264974,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:990709a5352ac9fc1de567fe8bdeef3436ea8e720726b4b93b30d03bba10ff03',
                    ],
                    sizeBytes: 607149477,
                },
                {
                    names: [
                        'quay.io/stolostron/management-ingress@sha256:36ea176ac9ab819d6bebb67e787f6aac8b2923c3697e7f86607ffb70f0ddb597',
                    ],
                    sizeBytes: 564136950,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:88a3589f42c8d96e7f7f577650479762fe28bd081c984df83f1931ba172b128b',
                    ],
                    sizeBytes: 548198479,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:35e4ce12313a7f953fd783147b1e001a1b4cc8070e56158525769e7c57eb298b',
                    ],
                    sizeBytes: 520720027,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:21cb2d46d7824bc8aab17dbcb9e0cb0605b158344ebaf1435892d8718fd20d16',
                    ],
                    sizeBytes: 503580749,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44b40e8eaf8274d09fdae9e88a473fc45cc26b1e6819fce640995aa8d486569a',
                    ],
                    sizeBytes: 491462280,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:61353c1c7924eeb54a5823efa073520873c3ae0810a03382ca38613417b26ded',
                    ],
                    sizeBytes: 466893255,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:562f754d15144a2dbd75a910bbd3f9e3ac224f600a9668c9e7d22c89c06744e7',
                    ],
                    sizeBytes: 466399767,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:537a0f672a108b1d13d03da0af4a7cdb56c19d1457d6a5b721939be93ef89b55',
                    ],
                    sizeBytes: 459857267,
                },
                {
                    names: [
                        'quay.io/stolostron/multicluster-operators-subscription@sha256:de4868dc2b435bcdb052c59d737645ca2c543e1a028e80f844de82780305a28a',
                    ],
                    sizeBytes: 456456041,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1e812489c8ab1ecfbf666735d5d3624a1b4a3afee898112e1e2d4ac9ac921484',
                    ],
                    sizeBytes: 454665707,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fca58a006719ca7bd38f80a2f1e034a0269869a956026d8da1372416487206e1',
                    ],
                    sizeBytes: 454632902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a468e228771477e311606f9723db544ade696af513af72339177c1c9fae00fc6',
                    ],
                    sizeBytes: 450750042,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c9b605738845814cb1449da6dbb5452a54d02e80b95e38ac543e509186cfa5c3',
                    ],
                    sizeBytes: 442022902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:464bb2981139b9f1a84c8a9f818cee290eafed16ad9eb24a17d94bbd19bb2890',
                    ],
                    sizeBytes: 434642001,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:62f78d4b596a3442aa870318ba15078d7bc8ce97ad32220bfa7efe76ff793025',
                    ],
                    sizeBytes: 434235070,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:22e14ec497d6fc4876d9c22f6dc0294f58e9943154e632d9296393b8386d1a8c',
                    ],
                    sizeBytes: 427983965,
                },
                {
                    names: [
                        'quay.io/stolostron/multicloud-manager@sha256:50bc885d4c31412c072e60a67dbbe76adf6fe8013db4f266e0d009baa841ed8d',
                    ],
                    sizeBytes: 422432116,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:838128200eeeddf2e9c27aeae0c537d43e8ce4a56b724ec6e56a444746769e61',
                    ],
                    sizeBytes: 420094811,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8edf2fdb662f223df63a34172ea3892c6a77d7bed54757c9f4b6c490715ada88',
                    ],
                    sizeBytes: 415061005,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:7483c6e225e66f7a9b4d19b288ca103a6831197c3f29cdbb591241dcf6e507f1',
                    ],
                    sizeBytes: 414228568,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:2890994475f3fb5e944fd580a727a738a456c9bbf78d37c23439fdead1d81b15',
                    ],
                    sizeBytes: 412125334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:cf09020c35a2d4c4b75b8a9d859d285b99e5c77d95ac4b4925b8bfbe0b960f47',
                    ],
                    sizeBytes: 411663844,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1ff9cd86fb30e6784add2760e51447c6811a28d55b1d9e879361b508666231b2',
                    ],
                    sizeBytes: 411078710,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:06292dbc0d4a151673f50619a976b8c760a0f44be939843bbd49cf2ee9280515',
                    ],
                    sizeBytes: 410814567,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ba8a86a7fe83bfd9021be07c44eb2f159e11b653c5c8563dcc1857a180203304',
                    ],
                    sizeBytes: 410565173,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:f9f643cfebc3980d128922fd4af1a13374befe50ad20c8efcc5ee0af9bf06c2b',
                    ],
                    sizeBytes: 409608726,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:3697473061205429952e53e44d8ce38f8a672f92f42bbed894449f9f878d3e11',
                    ],
                    sizeBytes: 409312334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:11313c8fba5a5a81e2adac6efe734859254168ce09350425f91a0cba4f0bf0c9',
                    ],
                    sizeBytes: 408838840,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:24c5947218c1ddc7b1a8b56db3b2ca2d08f2463db0311a68422c5448d93657f6',
                    ],
                    sizeBytes: 408723142,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44ba2f8d6e8e176818c768d5eb30b57122a867ac48b137557bd2be29193866cf',
                    ],
                    sizeBytes: 408643096,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5056c3ee86028a51b203388ad3f5d27702fb7d321a8b10d5d8cbebfb3525ba83',
                    ],
                    sizeBytes: 408550951,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:cfc8b3bfcfb74c844e122e82f33661cd56b9190c00c21793d9252366acb86afd',
                    ],
                    sizeBytes: 408357583,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:14a4ec5a7f70973ada672982c30dc9a7cc56eecec5a7255612fb048de6341bf5',
                    ],
                    sizeBytes: 408239144,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:32c91018a9b0836b2b5d7203436f20bd55e46881f5ccdabc32f8767f599994d0',
                    ],
                    sizeBytes: 408116711,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a9fa30bd99ef1f17481498f233cd188274ea88b832ae172f99e7911dc7b72a14',
                    ],
                    sizeBytes: 408087344,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:d18b411af134dab35828b69299457d58d2721834666c62decdba11960bf4c30f',
                    ],
                    sizeBytes: 407651499,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:54bb2d52cd65a2a2f3e48d97a005105f785ce2518f6bee9241504ce9c49fbcba',
                    ],
                    sizeBytes: 407155242,
                },
            ],
            nodeInfo: {
                architecture: 'amd64',
                bootID: '47543496-db5f-4117-8eb0-df24be2e698f',
                containerRuntimeVersion: 'cri-o://1.24.1-11.rhaos4.11.gitb0d2ef3.el8',
                kernelVersion: '4.18.0-372.13.1.el8_6.x86_64',
                kubeProxyVersion: 'v1.24.0+9546431',
                kubeletVersion: 'v1.24.0+9546431',
                machineID: 'ec2afade6ae64b3f24c10d61a03d2808',
                operatingSystem: 'linux',
                osImage: 'Red Hat Enterprise Linux CoreOS 411.86.202207090519-0 (Ootpa)',
                systemUUID: 'ec2afade-6ae6-4b3f-24c1-0d61a03d2808',
            },
        },
    },
    {
        apiVersion: 'v1',
        kind: 'Node',
        metadata: {
            annotations: {
                'cloud.network.openshift.io/egress-ipconfig':
                    '[{"interface":"eni-0cf09b1989475d84e","ifaddr":{"ipv4":"10.0.144.0/20"},"capacity":{"ipv4":14,"ipv6":15}}]',
                'csi.volume.kubernetes.io/nodeid':
                    '{"csi.sharedresource.openshift.io":"ip-10-0-147-239.ec2.internal","ebs.csi.aws.com":"i-031a57caad3c48cde"}',
                'machine.openshift.io/machine': 'openshift-machine-api/cs-aws-411-b25nm-89t8l-master-1',
                'machineconfiguration.openshift.io/controlPlaneTopology': 'HighlyAvailable',
                'machineconfiguration.openshift.io/currentConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/lastAppliedDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/reason': '',
                'machineconfiguration.openshift.io/state': 'Done',
                'volumes.kubernetes.io/controller-managed-attach-detach': 'true',
            },
            labels: {
                'beta.kubernetes.io/arch': 'amd64',
                'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                'beta.kubernetes.io/os': 'linux',
                'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                'kubernetes.io/arch': 'amd64',
                'kubernetes.io/hostname': 'ip-10-0-147-239.ec2.internal',
                'kubernetes.io/os': 'linux',
                'node-role.kubernetes.io/master': '',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                'node.openshift.io/os_id': 'rhcos',
                'topology.csidriver.csi/node': 'ip-10-0-147-239.ec2.internal',
                'topology.ebs.csi.aws.com/zone': 'us-east-1a',
                'topology.kubernetes.io/region': 'us-east-1',
                'topology.kubernetes.io/zone': 'us-east-1a',
            },
            name: 'ip-10-0-147-239.ec2.internal',
        },
        spec: {
            providerID: 'aws:///us-east-1a/i-031a57caad3c48cde',
        },
        status: {
            addresses: [
                {
                    address: '10.0.147.239',
                    type: 'InternalIP',
                },
                {
                    address: 'ip-10-0-147-239.ec2.internal',
                    type: 'Hostname',
                },
                {
                    address: 'ip-10-0-147-239.ec2.internal',
                    type: 'InternalDNS',
                },
            ],
            allocatable: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '7500m',
                'ephemeral-storage': '96143180846',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '31060468Ki',
                pods: '250',
            },
            capacity: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '8',
                'ephemeral-storage': '104322028Ki',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '32211444Ki',
                pods: '250',
            },
            conditions: [
                {
                    lastHeartbeatTime: '2022-07-19T18:41:35Z',
                    lastTransitionTime: '2022-07-19T11:33:03Z',
                    message: 'kubelet has sufficient memory available',
                    reason: 'KubeletHasSufficientMemory',
                    status: 'False',
                    type: 'MemoryPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:41:35Z',
                    lastTransitionTime: '2022-07-19T11:33:03Z',
                    message: 'kubelet has no disk pressure',
                    reason: 'KubeletHasNoDiskPressure',
                    status: 'False',
                    type: 'DiskPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:41:35Z',
                    lastTransitionTime: '2022-07-19T11:33:03Z',
                    message: 'kubelet has sufficient PID available',
                    reason: 'KubeletHasSufficientPID',
                    status: 'False',
                    type: 'PIDPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:41:35Z',
                    lastTransitionTime: '2022-07-19T11:33:13Z',
                    message: 'kubelet is posting ready status',
                    reason: 'KubeletReady',
                    status: 'True',
                    type: 'Ready',
                },
            ],
            daemonEndpoints: {
                kubeletEndpoint: {
                    Port: 10250,
                },
            },
            images: [
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5b84720b30885d36d76d18491948e4f5bec55afdbe3df8b6354f3bb7c965ca3d',
                    ],
                    sizeBytes: 1294514783,
                },
                {
                    names: [
                        'quay.io/stolostron/hive@sha256:27d71e4181a4a08018460a25f98692ddc48ffccf244fc0a7e60c5a8cbc17032b',
                    ],
                    sizeBytes: 1057197885,
                },
                {
                    names: [
                        'quay.io/stolostron/assisted-service@sha256:4a7048cd45ef5c6437699f21e9eb66649dc328451177a7649b2e715081caf810',
                    ],
                    sizeBytes: 878487204,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:876d023dcd0f7a23f791c8e5e990e8c3413b5c55a153a806743977b5041b9a45',
                    ],
                    sizeBytes: 866533954,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:2130761a5142145544302d275af6aca9a08349c6baf66d98be9d35b334d9d23c',
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:43833fe67332f28bc441aa78dbb09928e369019bf92c694ac4dd1494966a1782',
                        'registry.redhat.io/redhat/redhat-operator-index:v4.11',
                    ],
                    sizeBytes: 866533940,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-operator-index@sha256:713cb8029f42d10dc584a272e459ab54d91f640db61d2d9315cb00b9daf3eddd',
                    ],
                    sizeBytes: 864463412,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ec270d19aa0983e7eebe4c545daf8a3d657def92965d330f1b28aa5c6743a9a2',
                    ],
                    sizeBytes: 823541404,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/certified-operator-index@sha256:639ff227f7750695a568ee1962edb7b8369dc9544c6c09f3aac961cac8e712cd',
                        'registry.redhat.io/redhat/certified-operator-index@sha256:9f6ca8286261db9f44e807f20fbc1e31f648c7629c0a3ce4e1db8fc7c2e0838b',
                        'registry.redhat.io/redhat/certified-operator-index:v4.11',
                    ],
                    sizeBytes: 752245473,
                },
                {
                    names: [
                        'registry.redhat.io/redhat/redhat-marketplace-index@sha256:e4126951822c8f812e216bfe0124ef50b69e61a21196ad78a1ccd6f05d358ac3',
                        'registry.redhat.io/redhat/redhat-marketplace-index@sha256:ea1aa4140c5cfa6a66b1cc3e2d08a6d7c480e2b5bc6f17901f8f0c8e46dc1e23',
                        'registry.redhat.io/redhat/redhat-marketplace-index:v4.11',
                    ],
                    sizeBytes: 719788252,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fd41c91d1b78045023a3ba8963ab15104ea31a6c695a750872c80489c2d156f2',
                    ],
                    sizeBytes: 681947258,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:aa83a4173d3c98b819c59089bd1a765a51541f8ae035f3b16b7945b657be2383',
                    ],
                    sizeBytes: 612264974,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:990709a5352ac9fc1de567fe8bdeef3436ea8e720726b4b93b30d03bba10ff03',
                    ],
                    sizeBytes: 607149477,
                },
                {
                    names: [
                        'quay.io/stolostron/management-ingress@sha256:36ea176ac9ab819d6bebb67e787f6aac8b2923c3697e7f86607ffb70f0ddb597',
                    ],
                    sizeBytes: 564136950,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:88a3589f42c8d96e7f7f577650479762fe28bd081c984df83f1931ba172b128b',
                    ],
                    sizeBytes: 548198479,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:35e4ce12313a7f953fd783147b1e001a1b4cc8070e56158525769e7c57eb298b',
                    ],
                    sizeBytes: 520720027,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:21cb2d46d7824bc8aab17dbcb9e0cb0605b158344ebaf1435892d8718fd20d16',
                    ],
                    sizeBytes: 503580749,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44b40e8eaf8274d09fdae9e88a473fc45cc26b1e6819fce640995aa8d486569a',
                    ],
                    sizeBytes: 491462280,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1586414223a99398544d366664d0a8b62f4d7f9847dd28f713bb2f03b05f29a7',
                    ],
                    sizeBytes: 480035394,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:61353c1c7924eeb54a5823efa073520873c3ae0810a03382ca38613417b26ded',
                    ],
                    sizeBytes: 466893255,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:562f754d15144a2dbd75a910bbd3f9e3ac224f600a9668c9e7d22c89c06744e7',
                    ],
                    sizeBytes: 466399767,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:537a0f672a108b1d13d03da0af4a7cdb56c19d1457d6a5b721939be93ef89b55',
                    ],
                    sizeBytes: 459857267,
                },
                {
                    names: [
                        'quay.io/stolostron/multicluster-operators-subscription@sha256:de4868dc2b435bcdb052c59d737645ca2c543e1a028e80f844de82780305a28a',
                    ],
                    sizeBytes: 456456041,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1e812489c8ab1ecfbf666735d5d3624a1b4a3afee898112e1e2d4ac9ac921484',
                    ],
                    sizeBytes: 454665707,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fca58a006719ca7bd38f80a2f1e034a0269869a956026d8da1372416487206e1',
                    ],
                    sizeBytes: 454632902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a468e228771477e311606f9723db544ade696af513af72339177c1c9fae00fc6',
                    ],
                    sizeBytes: 450750042,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c9b605738845814cb1449da6dbb5452a54d02e80b95e38ac543e509186cfa5c3',
                    ],
                    sizeBytes: 442022902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:464bb2981139b9f1a84c8a9f818cee290eafed16ad9eb24a17d94bbd19bb2890',
                    ],
                    sizeBytes: 434642001,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:62f78d4b596a3442aa870318ba15078d7bc8ce97ad32220bfa7efe76ff793025',
                    ],
                    sizeBytes: 434235070,
                },
                {
                    names: [
                        'quay.io/stolostron/multicloud-manager@sha256:50bc885d4c31412c072e60a67dbbe76adf6fe8013db4f266e0d009baa841ed8d',
                    ],
                    sizeBytes: 422432116,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:838128200eeeddf2e9c27aeae0c537d43e8ce4a56b724ec6e56a444746769e61',
                    ],
                    sizeBytes: 420094811,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8edf2fdb662f223df63a34172ea3892c6a77d7bed54757c9f4b6c490715ada88',
                    ],
                    sizeBytes: 415061005,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:7483c6e225e66f7a9b4d19b288ca103a6831197c3f29cdbb591241dcf6e507f1',
                    ],
                    sizeBytes: 414228568,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:0ac5c0d6d4bb00b5800ff7d386be389551b62df0bd76415f1306de3c966e0ef7',
                    ],
                    sizeBytes: 412742265,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5c094985441bbf0f7164953398f297e390e40335e174a781a527c57edb7f374c',
                    ],
                    sizeBytes: 412481118,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:2890994475f3fb5e944fd580a727a738a456c9bbf78d37c23439fdead1d81b15',
                    ],
                    sizeBytes: 412125334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:cf09020c35a2d4c4b75b8a9d859d285b99e5c77d95ac4b4925b8bfbe0b960f47',
                    ],
                    sizeBytes: 411663844,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1ff9cd86fb30e6784add2760e51447c6811a28d55b1d9e879361b508666231b2',
                    ],
                    sizeBytes: 411078710,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:06292dbc0d4a151673f50619a976b8c760a0f44be939843bbd49cf2ee9280515',
                    ],
                    sizeBytes: 410814567,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:f9f643cfebc3980d128922fd4af1a13374befe50ad20c8efcc5ee0af9bf06c2b',
                    ],
                    sizeBytes: 409608726,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:3697473061205429952e53e44d8ce38f8a672f92f42bbed894449f9f878d3e11',
                    ],
                    sizeBytes: 409312334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44ba2f8d6e8e176818c768d5eb30b57122a867ac48b137557bd2be29193866cf',
                    ],
                    sizeBytes: 408643096,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:cfc8b3bfcfb74c844e122e82f33661cd56b9190c00c21793d9252366acb86afd',
                    ],
                    sizeBytes: 408357583,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:14a4ec5a7f70973ada672982c30dc9a7cc56eecec5a7255612fb048de6341bf5',
                    ],
                    sizeBytes: 408239144,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:32c91018a9b0836b2b5d7203436f20bd55e46881f5ccdabc32f8767f599994d0',
                    ],
                    sizeBytes: 408116711,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a9fa30bd99ef1f17481498f233cd188274ea88b832ae172f99e7911dc7b72a14',
                    ],
                    sizeBytes: 408087344,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:54bb2d52cd65a2a2f3e48d97a005105f785ce2518f6bee9241504ce9c49fbcba',
                    ],
                    sizeBytes: 407155242,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:7efeff8af16764e58d7e86dcd30948c27cdd59afbd7401ff7589eaf2b193c436',
                    ],
                    sizeBytes: 404873137,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a8794f2b814945c4e4c895e837b2bc75ae5e74b0b1d30b20c40dfaf788fae787',
                    ],
                    sizeBytes: 403282995,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:4771de80102403cdf67c2551439714a5511ad23baad91431782ac02ff23c95d1',
                    ],
                    sizeBytes: 401397764,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:6741e50a187bc33c8623ed4bd0044d8885d191482f55618d3cfa37ff1a7012dc',
                    ],
                    sizeBytes: 398606253,
                },
            ],
            nodeInfo: {
                architecture: 'amd64',
                bootID: '0750d928-d781-495e-a3a1-d415ab27bb09',
                containerRuntimeVersion: 'cri-o://1.24.1-11.rhaos4.11.gitb0d2ef3.el8',
                kernelVersion: '4.18.0-372.13.1.el8_6.x86_64',
                kubeProxyVersion: 'v1.24.0+9546431',
                kubeletVersion: 'v1.24.0+9546431',
                machineID: 'ec292cc6d32a51a422c1cf669d6b7292',
                operatingSystem: 'linux',
                osImage: 'Red Hat Enterprise Linux CoreOS 411.86.202207090519-0 (Ootpa)',
                systemUUID: 'ec292cc6-d32a-51a4-22c1-cf669d6b7292',
            },
        },
    },
    {
        apiVersion: 'v1',
        kind: 'Node',
        metadata: {
            annotations: {
                'cloud.network.openshift.io/egress-ipconfig':
                    '[{"interface":"eni-05e9b0871b32eea81","ifaddr":{"ipv4":"10.0.160.0/20"},"capacity":{"ipv4":14,"ipv6":15}}]',
                'csi.volume.kubernetes.io/nodeid':
                    '{"csi.sharedresource.openshift.io":"ip-10-0-162-56.ec2.internal","ebs.csi.aws.com":"i-0a11d7d4d86a48cef"}',
                'machine.openshift.io/machine': 'openshift-machine-api/cs-aws-411-b25nm-89t8l-master-2',
                'machineconfiguration.openshift.io/controlPlaneTopology': 'HighlyAvailable',
                'machineconfiguration.openshift.io/currentConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredConfig': 'rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/desiredDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/lastAppliedDrain':
                    'uncordon-rendered-master-5cc3e1097f46decd8083f0bbef323e10',
                'machineconfiguration.openshift.io/reason': '',
                'machineconfiguration.openshift.io/state': 'Done',
                'volumes.kubernetes.io/controller-managed-attach-detach': 'true',
            },
            labels: {
                'beta.kubernetes.io/arch': 'amd64',
                'beta.kubernetes.io/instance-type': 'm6a.2xlarge',
                'beta.kubernetes.io/os': 'linux',
                'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                'kubernetes.io/arch': 'amd64',
                'kubernetes.io/hostname': 'ip-10-0-162-56.ec2.internal',
                'kubernetes.io/os': 'linux',
                'node-role.kubernetes.io/master': '',
                'node-role.kubernetes.io/worker': '',
                'node.kubernetes.io/instance-type': 'm6a.2xlarge',
                'node.openshift.io/os_id': 'rhcos',
                'topology.csidriver.csi/node': 'ip-10-0-162-56.ec2.internal',
                'topology.ebs.csi.aws.com/zone': 'us-east-1c',
                'topology.kubernetes.io/region': 'us-east-1',
                'topology.kubernetes.io/zone': 'us-east-1c',
            },
            name: 'ip-10-0-162-56.ec2.internal',
        },
        spec: {
            providerID: 'aws:///us-east-1c/i-0a11d7d4d86a48cef',
        },
        status: {
            addresses: [
                {
                    address: '10.0.162.56',
                    type: 'InternalIP',
                },
                {
                    address: 'ip-10-0-162-56.ec2.internal',
                    type: 'Hostname',
                },
                {
                    address: 'ip-10-0-162-56.ec2.internal',
                    type: 'InternalDNS',
                },
            ],
            allocatable: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '7500m',
                'ephemeral-storage': '96143180846',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '31060460Ki',
                pods: '250',
            },
            capacity: {
                'attachable-volumes-aws-ebs': '39',
                cpu: '8',
                'ephemeral-storage': '104322028Ki',
                'hugepages-1Gi': '0',
                'hugepages-2Mi': '0',
                memory: '32211436Ki',
                pods: '250',
            },
            conditions: [
                {
                    lastHeartbeatTime: '2022-07-19T18:42:34Z',
                    lastTransitionTime: '2022-07-19T11:43:02Z',
                    message: 'kubelet has sufficient memory available',
                    reason: 'KubeletHasSufficientMemory',
                    status: 'False',
                    type: 'MemoryPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:42:34Z',
                    lastTransitionTime: '2022-07-19T11:43:02Z',
                    message: 'kubelet has no disk pressure',
                    reason: 'KubeletHasNoDiskPressure',
                    status: 'False',
                    type: 'DiskPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:42:34Z',
                    lastTransitionTime: '2022-07-19T11:43:02Z',
                    message: 'kubelet has sufficient PID available',
                    reason: 'KubeletHasSufficientPID',
                    status: 'False',
                    type: 'PIDPressure',
                },
                {
                    lastHeartbeatTime: '2022-07-19T18:42:34Z',
                    lastTransitionTime: '2022-07-19T11:43:13Z',
                    message: 'kubelet is posting ready status',
                    reason: 'KubeletReady',
                    status: 'True',
                    type: 'Ready',
                },
            ],
            daemonEndpoints: {
                kubeletEndpoint: {
                    Port: 10250,
                },
            },
            images: [
                {
                    names: [
                        'registry.redhat.io/ansible-automation-platform-22/platform-resource-runner-rhel8@sha256:bcd3bb6ea6e537899ce6a556a981c1bc92aa1c5d6916656be0ba4de5d6c5a4e4',
                        'registry.redhat.io/ansible-automation-platform-22/platform-resource-runner-rhel8@sha256:d22484e3cf9608384cab2e49876d644adfe1908569974aaa43ea9933c95777f3',
                    ],
                    sizeBytes: 1511009160,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5b84720b30885d36d76d18491948e4f5bec55afdbe3df8b6354f3bb7c965ca3d',
                    ],
                    sizeBytes: 1294514783,
                },
                {
                    names: [
                        'quay.io/stolostron/hive@sha256:27d71e4181a4a08018460a25f98692ddc48ffccf244fc0a7e60c5a8cbc17032b',
                    ],
                    sizeBytes: 1057197885,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:7a0ad0b0acbcdef440367c985a2e095a10de23e2f22b0527c5b6b78022755f40',
                    ],
                    sizeBytes: 955182038,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:3bf2dc09abede4f28e531ba0b0070dfd7844f45bf759006c31a117e03c8ce4a0',
                    ],
                    sizeBytes: 954814934,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ec270d19aa0983e7eebe4c545daf8a3d657def92965d330f1b28aa5c6743a9a2',
                    ],
                    sizeBytes: 823541404,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ab1582971a495722eb1f15ab234849026db159e6867a9f49b98f03820b6e5d28',
                    ],
                    sizeBytes: 733144740,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fd41c91d1b78045023a3ba8963ab15104ea31a6c695a750872c80489c2d156f2',
                    ],
                    sizeBytes: 681947258,
                },
                {
                    names: [
                        'registry.redhat.io/ansible-automation-platform-22/platform-resource-rhel8-operator@sha256:669364d69d3af09bb128fc02ac5f6c7dc9708bc638cd3d77fc1699e32e36bf1d',
                        'registry.redhat.io/ansible-automation-platform-22/platform-resource-rhel8-operator@sha256:887ada3f17fa4e7b4803709334b81e5405955fe0458c3da88c390f8e60dd5d67',
                    ],
                    sizeBytes: 637587838,
                },
                {
                    names: [
                        'registry.redhat.io/ansible-automation-platform-22/hub-rhel8-operator@sha256:2fe18112046bf0bc813c3340ee750cc5a8e9a05dd029a8ce5fe16920df3afc5e',
                        'registry.redhat.io/ansible-automation-platform-22/hub-rhel8-operator@sha256:68182d5c9ed09c64066d8bda6e0604248d258ce300d6edd946fe3bd0f33cde73',
                    ],
                    sizeBytes: 635349869,
                },
                {
                    names: [
                        'registry.redhat.io/ansible-automation-platform-22/controller-rhel8-operator@sha256:6967e86671f0b283de1ca25fb31e0d595dcbbf2878345a0feed0d1c680a2fd19',
                        'registry.redhat.io/ansible-automation-platform-22/controller-rhel8-operator@sha256:767c9d14fce64062cc0fe6c9d680a5ac6c898f38700bba0b8b3c464d47b38feb',
                    ],
                    sizeBytes: 635096535,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:aa83a4173d3c98b819c59089bd1a765a51541f8ae035f3b16b7945b657be2383',
                    ],
                    sizeBytes: 612264974,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:990709a5352ac9fc1de567fe8bdeef3436ea8e720726b4b93b30d03bba10ff03',
                    ],
                    sizeBytes: 607149477,
                },
                {
                    names: [
                        'quay.io/stolostron/management-ingress@sha256:36ea176ac9ab819d6bebb67e787f6aac8b2923c3697e7f86607ffb70f0ddb597',
                    ],
                    sizeBytes: 564136950,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:88a3589f42c8d96e7f7f577650479762fe28bd081c984df83f1931ba172b128b',
                    ],
                    sizeBytes: 548198479,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:35e4ce12313a7f953fd783147b1e001a1b4cc8070e56158525769e7c57eb298b',
                    ],
                    sizeBytes: 520720027,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:21cb2d46d7824bc8aab17dbcb9e0cb0605b158344ebaf1435892d8718fd20d16',
                    ],
                    sizeBytes: 503580749,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44b40e8eaf8274d09fdae9e88a473fc45cc26b1e6819fce640995aa8d486569a',
                    ],
                    sizeBytes: 491462280,
                },
                {
                    names: [
                        'quay.io/stolostron/redisgraph-tls@sha256:6b39347f5da89577a53339df1618ae8b2a5115e1576fbb64e46cc87854fa9499',
                    ],
                    sizeBytes: 484476029,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1586414223a99398544d366664d0a8b62f4d7f9847dd28f713bb2f03b05f29a7',
                    ],
                    sizeBytes: 480035394,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:61353c1c7924eeb54a5823efa073520873c3ae0810a03382ca38613417b26ded',
                    ],
                    sizeBytes: 466893255,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:562f754d15144a2dbd75a910bbd3f9e3ac224f600a9668c9e7d22c89c06744e7',
                    ],
                    sizeBytes: 466399767,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:537a0f672a108b1d13d03da0af4a7cdb56c19d1457d6a5b721939be93ef89b55',
                    ],
                    sizeBytes: 459857267,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:6119a71fbf48dc417da82b53e2f7fcc39b72689b0cd79377433239ba6d755f79',
                    ],
                    sizeBytes: 458398173,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c56de76d3498e5576fed5018880f3ecd3a7b6a9c85f9e037cdc4288e124f81d3',
                    ],
                    sizeBytes: 458031069,
                },
                {
                    names: [
                        'quay.io/stolostron/multicluster-operators-subscription@sha256:de4868dc2b435bcdb052c59d737645ca2c543e1a028e80f844de82780305a28a',
                    ],
                    sizeBytes: 456456041,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:1e812489c8ab1ecfbf666735d5d3624a1b4a3afee898112e1e2d4ac9ac921484',
                    ],
                    sizeBytes: 454665707,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:fca58a006719ca7bd38f80a2f1e034a0269869a956026d8da1372416487206e1',
                    ],
                    sizeBytes: 454632902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a468e228771477e311606f9723db544ade696af513af72339177c1c9fae00fc6',
                    ],
                    sizeBytes: 450750042,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c9b605738845814cb1449da6dbb5452a54d02e80b95e38ac543e509186cfa5c3',
                    ],
                    sizeBytes: 442022902,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:464bb2981139b9f1a84c8a9f818cee290eafed16ad9eb24a17d94bbd19bb2890',
                    ],
                    sizeBytes: 434642001,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:22e14ec497d6fc4876d9c22f6dc0294f58e9943154e632d9296393b8386d1a8c',
                    ],
                    sizeBytes: 427983965,
                },
                {
                    names: [
                        'quay.io/stolostron/multicloud-manager@sha256:50bc885d4c31412c072e60a67dbbe76adf6fe8013db4f266e0d009baa841ed8d',
                    ],
                    sizeBytes: 422432116,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:838128200eeeddf2e9c27aeae0c537d43e8ce4a56b724ec6e56a444746769e61',
                    ],
                    sizeBytes: 420094811,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8edf2fdb662f223df63a34172ea3892c6a77d7bed54757c9f4b6c490715ada88',
                    ],
                    sizeBytes: 415061005,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:7483c6e225e66f7a9b4d19b288ca103a6831197c3f29cdbb591241dcf6e507f1',
                    ],
                    sizeBytes: 414228568,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:0ac5c0d6d4bb00b5800ff7d386be389551b62df0bd76415f1306de3c966e0ef7',
                    ],
                    sizeBytes: 412742265,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5c094985441bbf0f7164953398f297e390e40335e174a781a527c57edb7f374c',
                    ],
                    sizeBytes: 412481118,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:2890994475f3fb5e944fd580a727a738a456c9bbf78d37c23439fdead1d81b15',
                    ],
                    sizeBytes: 412125334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:cf09020c35a2d4c4b75b8a9d859d285b99e5c77d95ac4b4925b8bfbe0b960f47',
                    ],
                    sizeBytes: 411663844,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:06292dbc0d4a151673f50619a976b8c760a0f44be939843bbd49cf2ee9280515',
                    ],
                    sizeBytes: 410814567,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ba8a86a7fe83bfd9021be07c44eb2f159e11b653c5c8563dcc1857a180203304',
                    ],
                    sizeBytes: 410565173,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:f9f643cfebc3980d128922fd4af1a13374befe50ad20c8efcc5ee0af9bf06c2b',
                    ],
                    sizeBytes: 409608726,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:3697473061205429952e53e44d8ce38f8a672f92f42bbed894449f9f878d3e11',
                    ],
                    sizeBytes: 409312334,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:11313c8fba5a5a81e2adac6efe734859254168ce09350425f91a0cba4f0bf0c9',
                    ],
                    sizeBytes: 408838840,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:24c5947218c1ddc7b1a8b56db3b2ca2d08f2463db0311a68422c5448d93657f6',
                    ],
                    sizeBytes: 408723142,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:44ba2f8d6e8e176818c768d5eb30b57122a867ac48b137557bd2be29193866cf',
                    ],
                    sizeBytes: 408643096,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5056c3ee86028a51b203388ad3f5d27702fb7d321a8b10d5d8cbebfb3525ba83',
                    ],
                    sizeBytes: 408550951,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:32c91018a9b0836b2b5d7203436f20bd55e46881f5ccdabc32f8767f599994d0',
                    ],
                    sizeBytes: 408116711,
                },
                {
                    names: [
                        'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a9fa30bd99ef1f17481498f233cd188274ea88b832ae172f99e7911dc7b72a14',
                    ],
                    sizeBytes: 408087344,
                },
            ],
            nodeInfo: {
                architecture: 'amd64',
                bootID: '98e0473a-850c-4a0d-84a6-4041bf90e75f',
                containerRuntimeVersion: 'cri-o://1.24.1-11.rhaos4.11.gitb0d2ef3.el8',
                kernelVersion: '4.18.0-372.13.1.el8_6.x86_64',
                kubeProxyVersion: 'v1.24.0+9546431',
                kubeletVersion: 'v1.24.0+9546431',
                machineID: 'ec2bdae01fa48d787a57cde8d54d1467',
                operatingSystem: 'linux',
                osImage: 'Red Hat Enterprise Linux CoreOS 411.86.202207090519-0 (Ootpa)',
                systemUUID: 'ec2bdae0-1fa4-8d78-7a57-cde8d54d1467',
            },
            volumesAttached: [
                {
                    devicePath: '',
                    name: 'kubernetes.io/csi/ebs.csi.aws.com^vol-0cfe5e1d0f29aea61',
                },
                {
                    devicePath: '',
                    name: 'kubernetes.io/csi/ebs.csi.aws.com^vol-0354385074206dce5',
                },
            ],
            volumesInUse: [
                'kubernetes.io/csi/ebs.csi.aws.com^vol-0354385074206dce5',
                'kubernetes.io/csi/ebs.csi.aws.com^vol-0cfe5e1d0f29aea61',
            ],
        },
    },
]
