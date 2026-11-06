// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"slices"
	"sync"
	"sync/atomic"
	"testing"
)

func TestReloaderGroupSnapshotsOwnSlices(t *testing.T) {
	for _, groups := range [][]string{
		{"secp256r1", "future-group", "X25519"},
		{"future-group", "X25519"},
	} {
		r := NewReloader()
		input := fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{
			Groups: groups, Ciphers: []string{"ECDHE-RSA-AES128-GCM-SHA256"},
		}}, true)
		want := input.clone()
		r.Apply(input)
		mutateGroupSnapshot(&input)
		if !settingsEqual(r.Settings(), want) {
			t.Fatal("caller mutated published settings")
		}
		returned := r.Settings()
		mutateGroupSnapshot(&returned)
		if !settingsEqual(r.Settings(), want) {
			t.Fatal("Settings exposed published slices")
		}
		if cfg, err := r.GetConfigForClient(nil); err == nil {
			cfg.CurvePreferences[0] = tls.CurveP521
			cfg.CipherSuites[0] = tls.TLS_RSA_WITH_AES_128_GCM_SHA256
			if !settingsEqual(r.Settings(), want) {
				t.Fatal("handshake config exposed published slices")
			}
		}
	}
}

func mutateGroupSnapshot(s *Settings) {
	if len(s.Curves) > 0 {
		s.Curves[0] = tls.CurveP521
	}
	if len(s.CipherSuites) > 0 {
		s.CipherSuites[0] = tls.TLS_RSA_WITH_AES_128_GCM_SHA256
	}
	if len(s.unknownGroups) > 0 {
		s.unknownGroups[0] = "changed"
	}
	if len(s.excludedGroups) > 0 {
		s.excludedGroups[0] = "changed"
	}
	if len(s.rejectedGroups) > 0 {
		s.rejectedGroups[0] = "changed"
	}
}

func TestReloaderConcurrentGroupSnapshots(t *testing.T) {
	profiles := []Settings{
		fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{
			Groups:  []string{"secp256r1", "unknown-a", "X25519"},
			Ciphers: []string{"ECDHE-RSA-AES128-GCM-SHA256"},
		}}, true),
		fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{
			Groups:  []string{"secp384r1", "unknown-b", "X25519MLKEM768"},
			Ciphers: []string{"ECDHE-RSA-AES256-GCM-SHA384"},
		}}, true),
	}
	r := NewReloader()
	r.Apply(profiles[0])
	var workers sync.WaitGroup
	// Worker goroutines must not call t.Error directly (races with the test
	// goroutine returning); record the first failure and report it once.
	var failed atomic.Bool
	fail := func(msg string) {
		if failed.CompareAndSwap(false, true) {
			t.Error(msg)
		}
	}
	workers.Go(func() {
		for i := 0; i < 50; i++ {
			r.Apply(profiles[i%2])
		}
	})
	for range 3 {
		workers.Go(func() {
			for range 50 {
				if failed.Load() {
					return
				}
				snapshot := r.Settings()
				if !settingsEqual(snapshot, profiles[0]) && !settingsEqual(snapshot, profiles[1]) {
					fail("Settings returned a partial profile update")
					return
				}
				mutateGroupSnapshot(&snapshot)
				cfg, err := r.GetConfigForClient(nil)
				if err != nil {
					fail(err.Error())
					return
				}
				match := func(s Settings) bool {
					return slices.Equal(cfg.CurvePreferences, s.Curves) && slices.Equal(cfg.CipherSuites, s.CipherSuites)
				}
				if !match(profiles[0]) && !match(profiles[1]) {
					fail("handshake saw a partial profile update")
					return
				}
				cfg.CurvePreferences[0] = tls.CurveP521
				cfg.CipherSuites[0] = tls.TLS_RSA_WITH_AES_128_GCM_SHA256
			}
		})
	}
	workers.Wait()
}

func TestFromProfileGroupDiagnostics(t *testing.T) {
	s := fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{
		Groups: []string{"secp256r1", "future-group", "X25519"},
	}}, true)
	if s.noUsableCurves || !slices.Equal(s.Curves, []tls.CurveID{tls.CurveP256}) ||
		!slices.Equal(s.unknownGroups, []string{"future-group"}) ||
		!slices.Equal(s.excludedGroups, []string{"X25519"}) {
		t.Fatalf("unexpected mixed-group policy and diagnostics: %+v", s)
	}
}
