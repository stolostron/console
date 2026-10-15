// Copyright Contributors to the Open Cluster Management project

package cors

import (
	"net/http"
)

// Middleware answers OPTIONS with 200 in non-production and allows credentialed
// requests from the standalone dev origins (http and https localhost on ports
// 3000, 3001, and 3002). Other origins receive no CORS headers. Production
// skips the middleware.
func Middleware(production bool) func(http.Handler) http.Handler {
	if production {
		return func(next http.Handler) http.Handler { return next }
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			// Origin can change whether CORS headers are present, so always vary.
			h.Add("Vary", "Origin")
			if origin := r.Header.Get("Origin"); allowedDevOrigin(origin) {
				h.Set("Access-Control-Allow-Origin", origin)
				h.Set("Access-Control-Allow-Credentials", "true")
				if r.Method == http.MethodOptions {
					if v := r.Header.Get("Access-Control-Request-Method"); v != "" {
						h.Set("Access-Control-Allow-Methods", v)
					}
					if v := r.Header.Get("Access-Control-Request-Headers"); v != "" {
						h.Set("Access-Control-Allow-Headers", v)
					}
				}
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func allowedDevOrigin(origin string) bool {
	switch origin {
	case "http://localhost:3000", "https://localhost:3000",
		"http://localhost:3001", "https://localhost:3001",
		"http://localhost:3002", "https://localhost:3002":
		return true
	default:
		return false
	}
}
