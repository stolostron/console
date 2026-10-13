// Copyright Contributors to the Open Cluster Management project

package vmproxy

import "testing"

func TestConvertNanocoresToMillicores(t *testing.T) {
	if got := convertNanocoresToMillicores("6894867n"); got != 6.894867 {
		t.Fatalf("got %v", got)
	}
	if got := convertNanocoresToMillicores("not-a-number"); got != 0 {
		t.Fatalf("got %v", got)
	}
}

func TestConvertKibibytesToMebibytes(t *testing.T) {
	if got := convertKibibytesToMebibytes("908492Ki"); got != 908492.0/1024 {
		t.Fatalf("got %v", got)
	}
}

func TestConvertBytesToGibibytes(t *testing.T) {
	if got := convertBytesToGibibytes(32212254720); got != 30 {
		t.Fatalf("got %v", got)
	}
}

func TestToMillicores(t *testing.T) {
	got, err := toMillicores("100m")
	if err != nil || got != 100 {
		t.Fatalf("got %v %v", got, err)
	}
	got, err = toMillicores("1")
	if err != nil || got != 1000 {
		t.Fatalf("got %v %v", got, err)
	}
	if _, err := toMillicores(""); err == nil {
		t.Fatal("expected error")
	}
}

func TestToMebibytes(t *testing.T) {
	got, err := toMebibytes("2294Mi")
	if err != nil || got != 2294 {
		t.Fatalf("got %v %v", got, err)
	}
	if _, err := toMebibytes(""); err == nil {
		t.Fatal("expected error")
	}
}

func TestCalUsagePercent(t *testing.T) {
	if got := calUsagePercent(14, 100); got != 14 {
		t.Fatalf("got %d", got)
	}
	if got := calUsagePercent(1, 0); got != 0 {
		t.Fatalf("got %d", got)
	}
}
