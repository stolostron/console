// Copyright Contributors to the Open Cluster Management project

package log

import (
	"log/slog"
	"os"
	"strings"
	"sync"
)

var (
	mu     sync.Mutex
	logger *slog.Logger
	level  slog.LevelVar
)

// init configures the default JSON slog logger from LOG_LEVEL.
func init() {
	SetLevel(os.Getenv("LOG_LEVEL"))
	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: &level,
	}))
}

// Logger returns the process-wide JSON slog logger.
func Logger() *slog.Logger {
	mu.Lock()
	defer mu.Unlock()
	return logger
}

// SetLevel sets the slog level from a name (debug/info/warn/error; default debug).
func SetLevel(name string) {
	var l slog.Level
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "trace", "debug":
		l = slog.LevelDebug
	case "info":
		l = slog.LevelInfo
	case "warn", "warning":
		l = slog.LevelWarn
	case "error":
		l = slog.LevelError
	default:
		l = slog.LevelDebug
	}
	level.Set(l)
}
