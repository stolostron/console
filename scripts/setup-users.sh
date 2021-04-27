#!/usr/bin/env bash
# Copyright Contributors to the Open Cluster Management project

if [ $# -eq 0 ]; then
    echo "No arguments supplied";
    echo "USAGE: ./setup-users.sh <PASSWORD>";
    exit 1
fi

PASSWORD=$1

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $DIR

# --------------------------------------------------------------------------------
# USERS HTPASSWORD SECRET
htpasswd -c -B -b users.htpasswd cluster-manager-admin $PASSWORD
htpasswd -b users.htpasswd cluster-admin $PASSWORD
htpasswd -b users.htpasswd admin $PASSWORD
htpasswd -b users.htpasswd manager $PASSWORD
htpasswd -b users.htpasswd viewer $PASSWORD
htpasswd -b users.htpasswd none $PASSWORD
oc delete secret htpass-secret -n openshift-config &> /dev/null
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

oc create clusterrolebinding cluster-manager-admin --clusterrole=open-cluster-management:cluster-manager-admin --user=cluster-manager-admin
oc create clusterrolebinding cluster-admin --clusterrole=cluster-admin --user=cluster-admin
oc create clusterrolebinding admin --clusterrole=admin --user=admin
oc create clusterrolebinding edit --clusterrole=edit --user=edit
oc create clusterrolebinding view --clusterrole=view --user=view

echo
echo "                  USER | RESOURCES  | NAMESPACE  | SECRETS    | ROLES      "
echo "-----------------------|------------|------------|------------|------------"
echo " cluster-manager-admin | read/write | read/write | read/write | read/write "
echo "         cluster-admin | read/write | read/write | read/write | read/write "
echo "                 admin | read/write | read       | read/write | read/write "
echo "                  edit | read/write | read       | read/write |            "
echo "                  view | read       | read       |            |            "
echo "                  none |            |            |            |            "
echo
