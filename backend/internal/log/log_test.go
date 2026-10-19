// Copyright Contributors to the Open Cluster Management project

package log

import (
	"log/slog"
	"testing"
)

func TestSetLevel(t *testing.T) {
	cases := []struct {
		name string
		want slog.Level
	}{
		{"trace", slog.LevelDebug},
		{"DEBUG", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{" Info ", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"WARNING", slog.LevelWarn},
		{"error", slog.LevelError},
		{"", slog.LevelDebug},
		{"nope", slog.LevelDebug},
	}
	for _, tc := range cases {
		SetLevel(tc.name)
		got := level.Level()
		if got != tc.want {
			t.Fatalf("SetLevel(%q)=%v want %v", tc.name, got, tc.want)
		}
	}
}

func TestLogger(t *testing.T) {
	if Logger() == nil {
		t.Fatal("expected logger")
	}
	// Second call still returns a logger under the mutex.
	if Logger() == nil {
		t.Fatal("expected logger on second call")
	}
}
