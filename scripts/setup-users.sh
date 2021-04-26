#!/usr/bin/env bash

# --------------------------------------------------------------------------------
# USERS HTPASSWORD SECRET
htpasswd -c -B -b users.htpasswd admin $1
htpasswd -b users.htpasswd manager $1
htpasswd -b users.htpasswd viewer $1
htpasswd -b users.htpasswd none $1
oc create secret generic htpass-secret --from-file=htpasswd=users.htpasswd -n openshift-config
rm -f users.htpasswd

# --------------------------------------------------------------------------------
# OPENSHIFT OAUTH IDENTITYPROVIDER
read -r -d '' OAUTH << EOM
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
    name: cluster
spec:
    identityProviders:
        - name: users
          mappingMethod: claim
          type: HTPasswd
          htpasswd:
              fileData:
                  name: htpass-secret
EOM
echo "$OAUTH"  | envsubst | oc apply -f -

# Create user group "managers" with user "manager"
oc adm groups new managers manager

# Create user group "viewers" with user "viewer"
oc adm groups new viewers viewer

# Create a ClusterRolebinding named "admin" using the "cluster-manager-admin" ClusterRole for user "admin"
oc create clusterrolebinding admin --clusterrole=open-cluster-management:cluster-manager-admin --user=admin

# Create namespace "connections"
oc create namespace connections

# Create a RoleBinding named "connections:admin" for namespace "connections" using the "admin" ClusterRole for group "managers" 
oc create rolebinding connections:admin --namespace=connections --clusterrole=admin --group=managers

# Create a RoleBinding named "connections:view" for namespace "connections" using the "view" ClusterRole for group "viewers" 
oc create rolebinding connections:view --namespace=connections --clusterrole=view --group=viewers