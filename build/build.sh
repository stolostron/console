#!/bin/bash -e
###############################################################################
# Copyright (c) 2020 Red Hat, Inc.
###############################################################################
# PARAMETERS
# $1 - Final image name and tag to be produced
export DOCKER_IMAGE_AND_TAG=${1}

docker build . \
$DOCKER_BUILD_OPTS \
-t $DOCKER_IMAGE:$DOCKER_BUILD_TAG \
-f Dockerfile

if [ ! -z "$DOCKER_IMAGE_AND_TAG" ]; then
    echo "Retagging image as $DOCKER_IMAGE_AND_TAG"
    docker tag $DOCKER_IMAGE:$DOCKER_BUILD_TAG "$DOCKER_IMAGE_AND_TAG"
fi
