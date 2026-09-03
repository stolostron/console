// Copyright Contributors to the Open Cluster Management project

package static

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	cspHeader = "default-src 'self';connect-src 'self' https://api.github.com;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self' 'unsafe-eval';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
	cacheProd = "public, max-age=604800"
	cacheLoc  = "public, max-age=3600"
	noCache   = "no-cache"
	noStore   = "no-store"
)

//go:embed all:public
var embeddedPublic embed.FS

var contentTypes = map[string]string{
	".html":  "text/html; charset=utf-8",
	".css":   "text/css; charset=UTF-8",
	".js":    "application/javascript; charset=UTF-8",
	".map":   "application/json; charset=utf-8",
	".jpg":   "image/jpeg",
	".json":  "application/json; charset=utf-8",
	".svg":   "image/svg+xml",
	".png":   "image/png",
	".ttf":   "font/ttf",
	".woff":  "font/woff",
	".woff2": "font/woff2",
}

// Options configure static asset serving.
type Options struct {
	FS         fs.FS
	Production bool
}

// Handler serves plugin and SPA files with Node-compatible headers and compression.
type Handler struct {
	fsys       fs.FS
	production bool
}

// New builds a static file handler. FS is typically os.DirFS(PUBLIC_FOLDER).
func New(opts Options) *Handler {
	return &Handler{fsys: opts.FS, production: opts.Production}
}

// OpenFS returns a filesystem for PUBLIC_FOLDER when the directory exists.
func OpenFS(publicFolder string) (fs.FS, bool) {
	if publicFolder == "" {
		return nil, false
	}
	st, err := os.Stat(publicFolder)
	if err != nil || !st.IsDir() {
		return nil, false
	}
	return os.DirFS(publicFolder), true
}

// BundledFS is plugin/SPA files compiled into the binary (overridden by PUBLIC_FOLDER).
func BundledFS() fs.FS {
	sub, err := fs.Sub(embeddedPublic, "public")
	if err != nil {
		return embeddedPublic
	}
	return sub
}

// IsStaticPath reports whether a path (already stripped of /multicloud) should be
// served as a static file rather than reverse-proxied to the Node sidecar.
// Bare paths other than / are not treated as SPA fallback so API routes like /hub
// still reach the sidecar.
func IsStaticPath(stripped string) bool {
	urlPath := strings.TrimSuffix(stripped, "/")
	if urlPath == "" || urlPath == "/" || urlPath == "/index.html" {
		return true
	}
	_, ok := contentTypes[path.Ext(urlPath)]
	return ok
}

func requestFileURL(stripped string) string {
	urlPath := stripped
	if i := strings.Index(urlPath, "?"); i >= 0 {
		urlPath = urlPath[:i]
	}
	if urlPath == "" || urlPath == "/" {
		return "/index.html"
	}
	return urlPath
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.fsys == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	urlPath := requestFileURL(r.URL.Path)
	ext := path.Ext(urlPath)
	setCacheHeaders(w, urlPath, h.production)

	contentType, ok := contentTypes[ext]
	if !ok {
		applog.Logger().Debug("unknown content type", "ext", ext)
		w.WriteHeader(http.StatusNotFound)
		return
	}

	rel := strings.TrimPrefix(path.Clean(urlPath), "/")
	if rel == "" || !fs.ValidPath(rel) {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	info, err := statFile(h.fsys, rel)
	if err != nil || info.IsDir() {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	mod := info.ModTime().UTC().Format(http.TimeFormat)
	w.Header().Set("Last-Modified", mod)
	if r.Header.Get("If-Modified-Since") == mod {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	accept := r.Header.Get("Accept-Encoding")
	if serveCompressed(w, h.fsys, rel, contentType, accept, "br", ".br") {
		return
	}
	if serveCompressed(w, h.fsys, rel, contentType, accept, "gzip", ".gz") {
		return
	}

	f, err := h.fsys.Open(rel)
	if err != nil {
		applog.Logger().Error("static open", "error", err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))
	w.WriteHeader(http.StatusOK)
	if _, copyErr := io.Copy(w, f); copyErr != nil {
		applog.Logger().Error("static copy", "error", copyErr)
	}
}

func setCacheHeaders(w http.ResponseWriter, urlPath string, production bool) {
	switch {
	case urlPath == "/index.html":
		w.Header().Set("Cache-Control", noCache)
		w.Header().Set("X-Frame-Options", "deny")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-DNS-Prefetch-Control", "off")
		w.Header().Set("Expect-CT", "enforce, max-age=30")
		w.Header().Set("Content-Security-Policy", cspHeader)
	case urlPath == "/plugin/plugin-entry.js" || urlPath == "/plugin/plugin-manifest.json":
		w.Header().Set("Cache-Control", noCache)
	case strings.Contains(urlPath, "/locales/"):
		if production {
			w.Header().Set("Cache-Control", cacheLoc)
		} else {
			w.Header().Set("Cache-Control", noStore)
		}
	default:
		if production {
			w.Header().Set("Cache-Control", cacheProd)
		} else {
			w.Header().Set("Cache-Control", noStore)
		}
	}
}

func serveCompressed(w http.ResponseWriter, fsys fs.FS, rel, contentType, accept, token, suffix string) bool {
	if !acceptsEncoding(accept, token) {
		return false
	}
	name := rel + suffix
	info, err := statFile(fsys, name)
	if err != nil || info.IsDir() {
		return false
	}
	f, err := fsys.Open(name)
	if err != nil {
		return false
	}
	defer f.Close()
	w.Header().Set("Content-Encoding", token)
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))
	w.WriteHeader(http.StatusOK)
	if _, copyErr := io.Copy(w, f); copyErr != nil {
		applog.Logger().Error("static copy", "error", copyErr)
	}
	return true
}

func acceptsEncoding(header, token string) bool {
	for _, part := range strings.Split(header, ",") {
		enc := strings.TrimSpace(part)
		if i := strings.Index(enc, ";"); i >= 0 {
			enc = strings.TrimSpace(enc[:i])
		}
		if enc == token {
			return true
		}
	}
	return false
}

func statFile(fsys fs.FS, name string) (fs.FileInfo, error) {
	if sf, ok := fsys.(fs.StatFS); ok {
		return sf.Stat(name)
	}
	f, err := fsys.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return f.Stat()
}
