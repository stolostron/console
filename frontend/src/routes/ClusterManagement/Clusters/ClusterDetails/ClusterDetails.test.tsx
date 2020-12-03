import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../../resources/managed-cluster-info'
import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../../../../resources/cluster-deployment'
import { CertificateSigningRequestList, CertificateSigningRequestListApiVersion, CertificateSigningRequestListKind, CertificateSigningRequestApiVersion, CertificateSigningRequestKind } from '../../../../resources/certificate-signing-requests'
import { PodList, PodListApiVersion, PodListKind, PodApiVersion, PodKind } from '../../../../resources/pod'
import { nockGet, nockClusterList, nockNamespacedList } from '../../../../lib/nock-util'
import { NavigationPath } from '../../../../NavigationPath'
import ClusterDetails from './ClusterDetails'

const mockManagedClusterInfo: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    status: {
        conditions: [
            {
                message: 'Accepted by hub cluster admin',
                reason: 'HubClusterAdminAccepted',
                status: 'True',
                type: 'HubAcceptedManagedCluster',
            }
        ],
        nodeList: [
            {
                name: "ip-10-0-134-240.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-west-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1c",
                    "node-role.kubernetes.io/worker": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-130-30.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-east-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1a",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "15944104Ki"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
            {
                name: "ip-10-0-151-254.ec2.internal",
                labels: {
                    "beta.kubernetes.io/instance-type": "m5.xlarge",
                    "failure-domain.beta.kubernetes.io/region": "us-south-1",
                    "failure-domain.beta.kubernetes.io/zone": "us-east-1b",
                    "node-role.kubernetes.io/master": "",
                    "node.kubernetes.io/instance-type": "m5.xlarge"
                },
                capacity: {
                    "cpu": "4",
                    "memory": "8194000Pi"
                },
                conditions: [
                    {
                        "status": "True",
                        "type": "Ready"
                    }
                ]
            },
        ]
    },
}
const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
       labels: {
          cloud: "AWS",
          'hive.openshift.io/cluster-platform': "aws",
          'hive.openshift.io/cluster-region': "us-east-1",
          region: "us-east-1",
          vendor: "OpenShift"
       },
       name: "test-cluster",
       namespace: "test-cluster",
       resourceVersion: "47731421",
       selfLink: "/apis/hive.openshift.io/v1/namespaces/test-cluster/clusterdeployments/test-cluster",
       uid: "f8014b27-4756-4c0e-83ea-42833be4bf52"
    },
    spec: {
       baseDomain: "dev02.test-chesterfield.com",
       clusterName: "test-cluster",
       installed: false,
       platform: {
          aws: {
             credentialsSecretRef: {
                name: "test-cluster-aws-creds"
             },
             region: "us-east-1"
          }
       },
       provisioning: {
          imageSetRef: {
             name: "img4.5.15-x86-64"
          },
          installConfigSecretRef: {
             name: "test-cluster-install-config"
          },
          sshPrivateKeySecretRef: {
             name: "test-cluster-ssh-private-key"
          }
       },
       pullSecretRef: {
          name: "test-cluster-pull-secret"
       }
    },
    status: {
       cliImage: "quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb",
       conditions: [],
       installerImage: "quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b",
       provisionRef: {
          name: "test-cluster-31-26h5q"
       }
    }
 }

const mockCertificateSigningRequestList: CertificateSigningRequestList = {
    apiVersion: CertificateSigningRequestListApiVersion,
    kind: CertificateSigningRequestListKind,
    metadata: { 
        selfLink: "/apis/certificates.k8s.io/v1beta1/certificatesigningrequests",
        resourceVersion: "48341234"
    },
    items: []
}

const mockHiveProvisionPods: PodList = {"kind":"PodList","apiVersion":"v1","metadata":{"selfLink":"/api/v1/namespaces/test-cluster/pods","resourceVersion":"50100517"},"items":[{"metadata":{"name":"test-cluster-0-92r2t-provision-wtsph","generateName":"test-cluster-0-92r2t-provision-","namespace":"test-cluster","selfLink":"/api/v1/namespaces/test-cluster/pods/test-cluster-0-92r2t-provision-wtsph","uid":"4facb96d-9737-407d-ac32-0b50bf66cc45","resourceVersion":"50084255","creationTimestamp":"2020-12-03T02:12:45Z","labels":{"cloud":"AWS","controller-uid":"a399648b-429b-4a96-928e-0396a335c3af","hive.openshift.io/cluster-deployment-name":"test-cluster","hive.openshift.io/cluster-platform":"aws","hive.openshift.io/cluster-provision":"test-cluster-0-92r2t","hive.openshift.io/cluster-provision-name":"test-cluster-0-92r2t","hive.openshift.io/cluster-region":"us-east-1","hive.openshift.io/install":"true","hive.openshift.io/job-type":"provision","job-name":"test-cluster-0-92r2t-provision","region":"us-east-1","vendor":"OpenShift"},"annotations":{"k8s.v1.cni.cncf.io/network-status":"[{\n    \"name\": \"openshift-sdn\",\n    \"interface\": \"eth0\",\n    \"ips\": [\n        \"10.128.2.191\"\n    ],\n    \"default\": true,\n    \"dns\": {}\n}]","k8s.v1.cni.cncf.io/networks-status":"[{\n    \"name\": \"openshift-sdn\",\n    \"interface\": \"eth0\",\n    \"ips\": [\n        \"10.128.2.191\"\n    ],\n    \"default\": true,\n    \"dns\": {}\n}]","openshift.io/scc":"restricted"},"ownerReferences":[{"apiVersion":"batch/v1","kind":"Job","name":"test-cluster-0-92r2t-provision","uid":"a399648b-429b-4a96-928e-0396a335c3af","controller":true,"blockOwnerDeletion":true}],"managedFields":[{"manager":"kube-controller-manager","operation":"Update","apiVersion":"v1","time":"2020-12-03T02:12:45Z","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:generateName":{},"f:labels":{".":{},"f:cloud":{},"f:controller-uid":{},"f:hive.openshift.io/cluster-deployment-name":{},"f:hive.openshift.io/cluster-platform":{},"f:hive.openshift.io/cluster-provision":{},"f:hive.openshift.io/cluster-provision-name":{},"f:hive.openshift.io/cluster-region":{},"f:hive.openshift.io/install":{},"f:hive.openshift.io/job-type":{},"f:job-name":{},"f:region":{},"f:vendor":{}},"f:ownerReferences":{".":{},"k:{\"uid\":\"a399648b-429b-4a96-928e-0396a335c3af\"}":{".":{},"f:apiVersion":{},"f:blockOwnerDeletion":{},"f:controller":{},"f:kind":{},"f:name":{},"f:uid":{}}}},"f:spec":{"f:containers":{"k:{\"name\":\"cli\"}":{".":{},"f:args":{},"f:command":{},"f:env":{".":{},"k:{\"name\":\"AWS_ACCESS_KEY_ID\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"AWS_SECRET_ACCESS_KEY\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"OPENSHIFT_INSTALL_INVOKER\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SKIP_GATHER_LOGS\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SSH_PRIV_KEY_PATH\"}":{".":{},"f:name":{},"f:value":{}}},"f:image":{},"f:imagePullPolicy":{},"f:name":{},"f:resources":{},"f:terminationMessagePath":{},"f:terminationMessagePolicy":{},"f:volumeMounts":{".":{},"k:{\"mountPath\":\"/installconfig\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/output\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/pullsecret\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/sshkeys\"}":{".":{},"f:mountPath":{},"f:name":{}}}},"k:{\"name\":\"hive\"}":{".":{},"f:args":{},"f:command":{},"f:env":{".":{},"k:{\"name\":\"AWS_ACCESS_KEY_ID\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"AWS_SECRET_ACCESS_KEY\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"OPENSHIFT_INSTALL_INVOKER\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SKIP_GATHER_LOGS\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SSH_PRIV_KEY_PATH\"}":{".":{},"f:name":{},"f:value":{}}},"f:image":{},"f:imagePullPolicy":{},"f:name":{},"f:resources":{".":{},"f:requests":{".":{},"f:memory":{}}},"f:terminationMessagePath":{},"f:terminationMessagePolicy":{},"f:volumeMounts":{".":{},"k:{\"mountPath\":\"/installconfig\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/output\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/pullsecret\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/sshkeys\"}":{".":{},"f:mountPath":{},"f:name":{}}}},"k:{\"name\":\"installer\"}":{".":{},"f:args":{},"f:command":{},"f:env":{".":{},"k:{\"name\":\"AWS_ACCESS_KEY_ID\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"AWS_SECRET_ACCESS_KEY\"}":{".":{},"f:name":{},"f:valueFrom":{".":{},"f:secretKeyRef":{".":{},"f:key":{},"f:name":{}}}},"k:{\"name\":\"OPENSHIFT_INSTALL_INVOKER\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SKIP_GATHER_LOGS\"}":{".":{},"f:name":{},"f:value":{}},"k:{\"name\":\"SSH_PRIV_KEY_PATH\"}":{".":{},"f:name":{},"f:value":{}}},"f:image":{},"f:imagePullPolicy":{},"f:name":{},"f:resources":{},"f:terminationMessagePath":{},"f:terminationMessagePolicy":{},"f:volumeMounts":{".":{},"k:{\"mountPath\":\"/installconfig\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/output\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/pullsecret\"}":{".":{},"f:mountPath":{},"f:name":{}},"k:{\"mountPath\":\"/sshkeys\"}":{".":{},"f:mountPath":{},"f:name":{}}}}},"f:dnsPolicy":{},"f:enableServiceLinks":{},"f:imagePullSecrets":{".":{},"k:{\"name\":\"test-cluster-merged-pull-secret\"}":{".":{},"f:name":{}}},"f:restartPolicy":{},"f:schedulerName":{},"f:securityContext":{},"f:serviceAccount":{},"f:serviceAccountName":{},"f:terminationGracePeriodSeconds":{},"f:volumes":{".":{},"k:{\"name\":\"installconfig\"}":{".":{},"f:name":{},"f:secret":{".":{},"f:defaultMode":{},"f:secretName":{}}},"k:{\"name\":\"output\"}":{".":{},"f:emptyDir":{},"f:name":{}},"k:{\"name\":\"pullsecret\"}":{".":{},"f:name":{},"f:secret":{".":{},"f:defaultMode":{},"f:secretName":{}}},"k:{\"name\":\"sshkeys\"}":{".":{},"f:name":{},"f:secret":{".":{},"f:defaultMode":{},"f:secretName":{}}}}}}},{"manager":"multus","operation":"Update","apiVersion":"v1","time":"2020-12-03T02:12:48Z","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:annotations":{"f:k8s.v1.cni.cncf.io/network-status":{},"f:k8s.v1.cni.cncf.io/networks-status":{}}}}},{"manager":"kubelet","operation":"Update","apiVersion":"v1","time":"2020-12-03T02:12:58Z","fieldsType":"FieldsV1","fieldsV1":{"f:status":{"f:conditions":{"k:{\"type\":\"ContainersReady\"}":{".":{},"f:lastProbeTime":{},"f:lastTransitionTime":{},"f:message":{},"f:reason":{},"f:status":{},"f:type":{}},"k:{\"type\":\"Initialized\"}":{".":{},"f:lastProbeTime":{},"f:lastTransitionTime":{},"f:status":{},"f:type":{}},"k:{\"type\":\"Ready\"}":{".":{},"f:lastProbeTime":{},"f:lastTransitionTime":{},"f:message":{},"f:reason":{},"f:status":{},"f:type":{}}},"f:containerStatuses":{},"f:hostIP":{},"f:phase":{},"f:podIP":{},"f:podIPs":{".":{},"k:{\"ip\":\"10.128.2.191\"}":{".":{},"f:ip":{}}},"f:startTime":{}}}}]},"spec":{"volumes":[{"name":"output","emptyDir":{}},{"name":"installconfig","secret":{"secretName":"test-cluster-install-config","defaultMode":420}},{"name":"pullsecret","secret":{"secretName":"test-cluster-merged-pull-secret","defaultMode":420}},{"name":"sshkeys","secret":{"secretName":"test-cluster-ssh-private-key","defaultMode":420}},{"name":"cluster-installer-token-qfpxn","secret":{"secretName":"cluster-installer-token-qfpxn","defaultMode":420}}],"containers":[{"name":"installer","image":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:30feb7ae3a9f5d6050381b26a1a2a567e785840cc315a10381b25750192fa507","command":["/bin/sh","-c"],"args":["cp -v /bin/openshift-install /output/openshift-install.tmp && mv -v /output/openshift-install.tmp /output/openshift-install && ls -la /output"],"env":[{"name":"OPENSHIFT_INSTALL_INVOKER","value":"hive"},{"name":"AWS_ACCESS_KEY_ID","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_access_key_id"}}},{"name":"AWS_SECRET_ACCESS_KEY","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_secret_access_key"}}},{"name":"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE","value":"quay.io/openshift-release-dev/ocp-release:4.6.6-x86_64"},{"name":"SKIP_GATHER_LOGS","value":"true"},{"name":"SSH_PRIV_KEY_PATH","value":"/sshkeys/ssh-privatekey"}],"resources":{},"volumeMounts":[{"name":"output","mountPath":"/output"},{"name":"installconfig","mountPath":"/installconfig"},{"name":"pullsecret","mountPath":"/pullsecret"},{"name":"sshkeys","mountPath":"/sshkeys"},{"name":"cluster-installer-token-qfpxn","readOnly":true,"mountPath":"/var/run/secrets/kubernetes.io/serviceaccount"}],"terminationMessagePath":"/dev/termination-log","terminationMessagePolicy":"File","imagePullPolicy":"IfNotPresent","securityContext":{"capabilities":{"drop":["KILL","MKNOD","SETGID","SETUID"]},"runAsUser":1000750000}},{"name":"cli","image":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5dd3f36241c449d56a08e481583b6fb5b5b59c91beada7b475e60dd9ecd19ce7","command":["/bin/sh","-c"],"args":["cp -v /usr/bin/oc /output/oc.tmp && mv -v /output/oc.tmp /output/oc && ls -la /output"],"env":[{"name":"OPENSHIFT_INSTALL_INVOKER","value":"hive"},{"name":"AWS_ACCESS_KEY_ID","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_access_key_id"}}},{"name":"AWS_SECRET_ACCESS_KEY","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_secret_access_key"}}},{"name":"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE","value":"quay.io/openshift-release-dev/ocp-release:4.6.6-x86_64"},{"name":"SKIP_GATHER_LOGS","value":"true"},{"name":"SSH_PRIV_KEY_PATH","value":"/sshkeys/ssh-privatekey"}],"resources":{},"volumeMounts":[{"name":"output","mountPath":"/output"},{"name":"installconfig","mountPath":"/installconfig"},{"name":"pullsecret","mountPath":"/pullsecret"},{"name":"sshkeys","mountPath":"/sshkeys"},{"name":"cluster-installer-token-qfpxn","readOnly":true,"mountPath":"/var/run/secrets/kubernetes.io/serviceaccount"}],"terminationMessagePath":"/dev/termination-log","terminationMessagePolicy":"File","imagePullPolicy":"IfNotPresent","securityContext":{"capabilities":{"drop":["KILL","MKNOD","SETGID","SETUID"]},"runAsUser":1000750000}},{"name":"hive","image":"quay.io/openshift-hive/hive@sha256:906853786cea3dca2cebc01196d598dab6329c24ab46c443ab837937cfd52335","command":["/bin/sh","-c"],"args":["/usr/bin/hiveutil install-manager --work-dir /output --log-level debug test-cluster test-cluster-0-92r2t"],"env":[{"name":"OPENSHIFT_INSTALL_INVOKER","value":"hive"},{"name":"AWS_ACCESS_KEY_ID","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_access_key_id"}}},{"name":"AWS_SECRET_ACCESS_KEY","valueFrom":{"secretKeyRef":{"name":"test-cluster-aws-creds","key":"aws_secret_access_key"}}},{"name":"OPENSHIFT_INSTALL_RELEASE_IMAGE_OVERRIDE","value":"quay.io/openshift-release-dev/ocp-release:4.6.6-x86_64"},{"name":"SKIP_GATHER_LOGS","value":"true"},{"name":"SSH_PRIV_KEY_PATH","value":"/sshkeys/ssh-privatekey"}],"resources":{"requests":{"memory":"800Mi"}},"volumeMounts":[{"name":"output","mountPath":"/output"},{"name":"installconfig","mountPath":"/installconfig"},{"name":"pullsecret","mountPath":"/pullsecret"},{"name":"sshkeys","mountPath":"/sshkeys"},{"name":"cluster-installer-token-qfpxn","readOnly":true,"mountPath":"/var/run/secrets/kubernetes.io/serviceaccount"}],"terminationMessagePath":"/dev/termination-log","terminationMessagePolicy":"File","imagePullPolicy":"Always","securityContext":{"capabilities":{"drop":["KILL","MKNOD","SETGID","SETUID"]},"runAsUser":1000750000}}],"restartPolicy":"Never","terminationGracePeriodSeconds":30,"dnsPolicy":"ClusterFirst","serviceAccountName":"cluster-installer","serviceAccount":"cluster-installer","nodeName":"ip-10-0-153-194.ec2.internal","securityContext":{"seLinuxOptions":{"level":"s0:c27,c24"},"fsGroup":1000750000},"imagePullSecrets":[{"name":"test-cluster-merged-pull-secret"}],"schedulerName":"default-scheduler","tolerations":[{"key":"node.kubernetes.io/not-ready","operator":"Exists","effect":"NoExecute","tolerationSeconds":300},{"key":"node.kubernetes.io/unreachable","operator":"Exists","effect":"NoExecute","tolerationSeconds":300},{"key":"node.kubernetes.io/memory-pressure","operator":"Exists","effect":"NoSchedule"}],"priority":0,"enableServiceLinks":true},"status":{"phase":"Running","conditions":[{"type":"Initialized","status":"True","lastProbeTime":null,"lastTransitionTime":"2020-12-03T02:12:45Z"},{"type":"Ready","status":"False","lastProbeTime":null,"lastTransitionTime":"2020-12-03T02:12:45Z","reason":"ContainersNotReady","message":"containers with unready status: [installer cli]"},{"type":"ContainersReady","status":"False","lastProbeTime":null,"lastTransitionTime":"2020-12-03T02:12:45Z","reason":"ContainersNotReady","message":"containers with unready status: [installer cli]"},{"type":"PodScheduled","status":"True","lastProbeTime":null,"lastTransitionTime":"2020-12-03T02:12:45Z"}],"hostIP":"10.0.153.194","podIP":"10.128.2.191","podIPs":[{"ip":"10.128.2.191"}],"startTime":"2020-12-03T02:12:45Z","containerStatuses":[{"name":"cli","state":{"terminated":{"exitCode":0,"reason":"Completed","startedAt":"2020-12-03T02:12:58Z","finishedAt":"2020-12-03T02:12:58Z","containerID":"cri-o://ea28c221ab4f2922c29098dc759c969650fca040c317870e5664b9a2084d8ba0"}},"lastState":{},"ready":false,"restartCount":0,"image":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5dd3f36241c449d56a08e481583b6fb5b5b59c91beada7b475e60dd9ecd19ce7","imageID":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:5dd3f36241c449d56a08e481583b6fb5b5b59c91beada7b475e60dd9ecd19ce7","containerID":"cri-o://ea28c221ab4f2922c29098dc759c969650fca040c317870e5664b9a2084d8ba0","started":false},{"name":"hive","state":{"running":{"startedAt":"2020-12-03T02:12:58Z"}},"lastState":{},"ready":true,"restartCount":0,"image":"quay.io/openshift-hive/hive@sha256:906853786cea3dca2cebc01196d598dab6329c24ab46c443ab837937cfd52335","imageID":"quay.io/openshift-hive/hive@sha256:906853786cea3dca2cebc01196d598dab6329c24ab46c443ab837937cfd52335","containerID":"cri-o://80b310d6a0439d8ef1daee94b4bbcfdeacaaa8bef39bc073fd0956e50e14e8ba","started":true},{"name":"installer","state":{"terminated":{"exitCode":0,"reason":"Completed","startedAt":"2020-12-03T02:12:55Z","finishedAt":"2020-12-03T02:12:55Z","containerID":"cri-o://8992869c0059b6e53a68d6cce243014da053415a417d98723ef82191be5daafd"}},"lastState":{},"ready":false,"restartCount":0,"image":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:30feb7ae3a9f5d6050381b26a1a2a567e785840cc315a10381b25750192fa507","imageID":"quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:30feb7ae3a9f5d6050381b26a1a2a567e785840cc315a10381b25750192fa507","containerID":"cri-o://8992869c0059b6e53a68d6cce243014da053415a417d98723ef82191be5daafd","started":false}],"qosClass":"Burstable"}}]}

const clusterDeployment404 = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"clusterdeployments.hive.openshift.io \"foobar\" not found","reason":"NotFound","details":{"name":"foobar","group":"hive.openshift.io","kind":"clusterdeployments"},"code":404}
const managedClusterInfo404 = {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"managedclusterinfos.internal.open-cluster-management.io \"foobar\" not found","reason":"NotFound","details":{"name":"foobar","group":"internal.open-cluster-management.io","kind":"managedclusterinfos"},"code":404}

const nockManagedClusterInfo = () => nockGet(mockManagedClusterInfo)
const nockClusterDeployment = () => nockGet(mockClusterDeployment)
const nockCertificateSigningRequestList = () => nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCertificateSigningRequestList, ['open-cluster-management.io/cluster-name=test-cluster'])
const nockHiveProvisionJob = () => nockNamespacedList({ apiVersion: PodApiVersion, kind: PodKind, metadata: { namespace: 'test-cluster' } }, mockHiveProvisionPods, ['hive.openshift.io/cluster-deployment-name=test-cluster', 'hive.openshift.io/job-type=provision'])

const nockManagedClusterInfo404 = () => nockGet(mockManagedClusterInfo, managedClusterInfo404, 404)
const nockClusterDeployment404 = () => nockGet(mockClusterDeployment, clusterDeployment404, 404)

describe('ClusterDetails page', () => {
    const Component = () => (
        <MemoryRouter initialEntries={['/cluster-management/cluster-management/clusters/test-cluster']}>
            <Switch>
                <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
            </Switch>
        </MemoryRouter>
    )
    test('renders', async () => {
        nockManagedClusterInfo()
        nockClusterDeployment()
        nockCertificateSigningRequestList()
        nockHiveProvisionJob()

        const { getByText } = render(<Component />)
        await waitFor(() => expect(getByText('cluster.details')).toBeInTheDocument())
        await waitFor(() => expect(getByText('view.logs')).toBeInTheDocument())

        // Nodes tab
        userEvent.click(getByText('Nodes'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Role'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
        userEvent.click(getByText('Region'))
        await waitFor(() => expect(getByText( mockManagedClusterInfo.status?.nodeList?.[0].name!)).toBeInTheDocument())
    })
    test('renders error state', async () => {
        nockManagedClusterInfo404()
        nockClusterDeployment404()
        nockCertificateSigningRequestList()

        const { getByText } = render(<Component />)
        await waitFor(() => expect(getByText('Error')).toBeInTheDocument())
    })
})
