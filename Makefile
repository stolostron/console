-include $(shell curl -s -H 'Accept: application/vnd.github.v4.raw' -L https://api.github.com/repos/open-cluster-management/build-harness-extensions/contents/templates/Makefile.build-harness-bootstrap -o .build-harness-bootstrap; echo .build-harness-bootstrap)

export PROJECT_DIR            = $(shell 'pwd')
export BUILD_DIR              = $(PROJECT_DIR)/build
export COMPONENT_SCRIPTS_PATH = $(BUILD_DIR)

export GIT_REMOTE_URL  = $(shell git config --get remote.origin.url)
export DOCKER_IMAGE  ?= $(COMPONENT_NAME)
export IMAGE_DESCRIPTION ?= Console
export DOCKER_BUILD_TAG  ?= latest
export DOCKER_BUILD_OPTS  = --build-arg VCS_REF=$(VCS_REF) \
	--build-arg VCS_URL=$(GIT_REMOTE_URL) \
	--build-arg IMAGE_NAME=$(DOCKER_IMAGE) \
	--build-arg IMAGE_DESCRIPTION=$(IMAGE_DESCRIPTION) 
