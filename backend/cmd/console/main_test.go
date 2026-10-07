// Copyright Contributors to the Open Cluster Management project

package main

import (
	"errors"
	"path/filepath"
	"testing"
)

func TestRunMissingServiceAccountToken(t *testing.T) {
	t.Setenv("ENV_FILE", filepath.Join(t.TempDir(), "missing.env"))
	t.Setenv("TOKEN", "")
	err := run()
	if !errors.Is(err, errMissingToken) {
		t.Fatalf("run() err=%v want errMissingToken", err)
	}
}
