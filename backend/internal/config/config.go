// Copyright Contributors to the Open Cluster Management project

package config

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/joho/godotenv"
	applog "github.com/stolostron/console/backend/internal/log"
)

const debounce = time.Second

// Config is process configuration loaded from env, .env, and the config/ directory.
type Config struct {
	Port           string
	NodeBackendURL string
	ConfigDir      string
	CertsDir       string
	EnvFile        string
	ClusterAPIURL  string
	Token          string
	CACert         string
	ServiceCACert  string
	LogLevel       string

	mu       sync.RWMutex
	settings map[string]string
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// Load reads ENV_FILE (if present) then environment variables.
func Load() *Config {
	envFile := envOr("ENV_FILE", ".env")
	_ = godotenv.Load(envFile)

	cfg := &Config{
		Port:           envOr("PORT", "4000"),
		NodeBackendURL: envOr("NODE_BACKEND_URL", "https://127.0.0.1:4001"),
		ConfigDir:      envOr("CONFIG_DIR", "config"),
		CertsDir:       envOr("CERTS_DIR", "certs"),
		EnvFile:        envFile,
		ClusterAPIURL:  os.Getenv("CLUSTER_API_URL"),
		Token:          os.Getenv("TOKEN"),
		CACert:         os.Getenv("CA_CERT"),
		ServiceCACert:  os.Getenv("SERVICE_CA_CERT"),
		LogLevel:       envOr("LOG_LEVEL", "debug"),
		settings:       map[string]string{},
	}
	_ = cfg.ReloadSettings()
	return cfg
}

// Settings returns a copy of filename→contents from the config directory.
func (c *Config) Settings() map[string]string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	out := make(map[string]string, len(c.settings))
	for k, v := range c.settings {
		out[k] = v
	}
	return out
}

// ReloadSettings reads the config directory and promotes selected keys to the process env.
func (c *Config) ReloadSettings() error {
	entries, err := os.ReadDir(c.ConfigDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	next := map[string]string{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		path := filepath.Join(c.ConfigDir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		next[entry.Name()] = string(data)
	}

	c.mu.Lock()
	prev := c.settings
	c.settings = next
	c.mu.Unlock()

	promote := func(key string) {
		if val, ok := next[key]; ok {
			_ = os.Setenv(key, val)
		} else if _, had := prev[key]; had {
			_ = os.Unsetenv(key)
		}
	}

	for key := range next {
		if strings.HasPrefix(key, "LOG_") || strings.HasPrefix(key, "APP_SEARCH_") {
			_ = os.Setenv(key, next[key])
		}
	}
	for key := range prev {
		if (strings.HasPrefix(key, "LOG_") || strings.HasPrefix(key, "APP_SEARCH_")) && next[key] == "" {
			_ = os.Unsetenv(key)
		}
	}
	promote("globalSearchFeatureFlag")
	promote("UPGRADE_RISKS_PREDICTION_URL")

	if lvl, ok := next["LOG_LEVEL"]; ok {
		c.LogLevel = lvl
		applog.SetLevel(lvl)
	}
	return nil
}

// Watch reloads settings when files under ConfigDir change. Call cancel to stop.
func (c *Config) Watch() (cancel func(), err error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(c.ConfigDir, 0o755); err != nil {
		_ = watcher.Close()
		return nil, err
	}
	if err := watcher.Add(c.ConfigDir); err != nil {
		_ = watcher.Close()
		return nil, err
	}

	done := make(chan struct{})
	go func() {
		timer := time.NewTimer(debounce)
		if !timer.Stop() {
			<-timer.C
		}
		pending := false
		for {
			select {
			case <-done:
				timer.Stop()
				_ = watcher.Close()
				return
			case ev, ok := <-watcher.Events:
				if !ok {
					return
				}
				if ev.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Remove|fsnotify.Rename) == 0 {
					continue
				}
				if !pending {
					pending = true
					timer.Reset(debounce)
				}
			case <-timer.C:
				pending = false
				_ = c.ReloadSettings()
			case <-watcher.Errors:
			}
		}
	}()

	return func() { close(done) }, nil
}
