// Copyright Contributors to the Open Cluster Management project

package main

import (
	"context"
	"errors"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"syscall"
	"testing"
	"time"

	"github.com/stolostron/console/backend/internal/auth"
)

func TestPreferServiceCA(t *testing.T) {
	if got := preferServiceCA(nil, []byte("cluster")); string(got) != "cluster" {
		t.Fatalf("empty service CA: %q", got)
	}
	if got := preferServiceCA([]byte{}, []byte("cluster")); string(got) != "cluster" {
		t.Fatalf("zero-length service CA: %q", got)
	}
	if got := preferServiceCA([]byte("service"), []byte("cluster")); string(got) != "service" {
		t.Fatalf("service CA wins: %q", got)
	}
}

func TestServiceAccountNamespace_FromEnv(t *testing.T) {
	restore := setServiceAccountNamespacePath(filepath.Join(t.TempDir(), "missing"))
	defer restore()

	t.Setenv("NAMESPACE", "  openshift-console  ")
	if got := serviceAccountNamespace(); got != "openshift-console" {
		t.Fatalf("got %q", got)
	}
}

func TestServiceAccountNamespace_FromFile(t *testing.T) {
	dir := t.TempDir()
	nsFile := filepath.Join(dir, "namespace")
	if err := os.WriteFile(nsFile, []byte("  acm  \n"), 0o644); err != nil {
		t.Fatal(err)
	}
	restore := setServiceAccountNamespacePath(nsFile)
	defer restore()

	t.Setenv("NAMESPACE", "ignored")
	if got := serviceAccountNamespace(); got != "acm" {
		t.Fatalf("got %q", got)
	}
}

func TestRun_MissingToken(t *testing.T) {
	restoreSA := auth.SetServiceAccountDir(t.TempDir())
	defer restoreSA()
	isolateRunEnv(t)

	err := run()
	if !errors.Is(err, errMissingToken) {
		t.Fatalf("expected errMissingToken, got %v", err)
	}
}

func TestRun_MissingClusterAPIURL(t *testing.T) {
	restoreSA := mountTestServiceAccount(t)
	defer restoreSA()
	isolateRunEnv(t)
	t.Setenv("TOKEN", "test-token")
	t.Setenv("CLUSTER_API_URL", "")

	err := run()
	if err == nil || err.Error() != "CLUSTER_API_URL is not set" {
		t.Fatalf("expected CLUSTER_API_URL error, got %v", err)
	}
}

func TestRun_InvalidClusterAPIURL(t *testing.T) {
	restoreSA := mountTestServiceAccount(t)
	defer restoreSA()
	isolateRunEnv(t)
	t.Setenv("TOKEN", "test-token")
	t.Setenv("CLUSTER_API_URL", "://")

	err := run()
	if err == nil {
		t.Fatal("expected url.Parse error")
	}
}

func TestRun_StartsAndStopsOnSignal(t *testing.T) {
	restoreSA := mountTestServiceAccount(t)
	defer restoreSA()
	restoreNS := setServiceAccountNamespacePath(filepath.Join(t.TempDir(), "missing"))
	defer restoreNS()

	isolateRunEnv(t)
	t.Setenv("TOKEN", "test-token")
	t.Setenv("CLUSTER_API_URL", "https://127.0.0.1:1")
	t.Setenv("DISABLE_EVENTS", "true")
	t.Setenv("NAMESPACE", "test-ns")
	t.Setenv("PORT", freePort(t))

	errCh := make(chan error, 1)
	go func() { errCh <- run() }()

	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		conn, dialErr := net.DialTimeout("tcp", "127.0.0.1:"+os.Getenv("PORT"), 50*time.Millisecond)
		if dialErr == nil {
			conn.Close()
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	if err := syscall.Kill(os.Getpid(), syscall.SIGTERM); err != nil {
		t.Fatal(err)
	}

	select {
	case err := <-errCh:
		if err != nil && !errors.Is(err, context.Canceled) {
			t.Fatalf("expected context.Canceled or nil, got %v", err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("run did not exit after SIGTERM")
	}
}

func isolateRunEnv(t *testing.T) {
	t.Helper()
	envFile := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(envFile, nil, 0o644); err != nil {
		t.Fatal(err)
	}
	cfgDir := t.TempDir()
	certsDir := t.TempDir()

	t.Setenv("ENV_FILE", envFile)
	t.Setenv("CONFIG_DIR", cfgDir)
	t.Setenv("CERTS_DIR", certsDir)
	t.Setenv("PUBLIC_FOLDER", filepath.Join(t.TempDir(), "missing-public"))
	t.Setenv("TOKEN", "")
	t.Setenv("CLUSTER_API_URL", "")
	t.Setenv("NODE_ENV", "")
}

func mountTestServiceAccount(t *testing.T) func() {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "token"), []byte("test-token"), 0o644); err != nil {
		t.Fatal(err)
	}
	return auth.SetServiceAccountDir(dir)
}

func freePort(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	ln.Close()
	return itoa(port)
}

func itoa(port int) string {
	return strconv.Itoa(port)
}
