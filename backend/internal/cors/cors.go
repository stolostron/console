// Copyright Contributors to the Open Cluster Management project

package cors

import (
	"net/http"
)

// Comment to be removed as a part of the backend-node decommissioning, see ACM-42603
// Middleware mirrors backend-node/src/lib/cors.ts: reflect Origin and answer OPTIONS.
// with 200 in non-production so standalone dev (webpack on :3000/:3001/:3002) can call :4000.
func Middleware(production bool) func(http.Handler) http.Handler {
	if production {
		return func(next http.Handler) http.Handler { return next }
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if origin := r.Header.Get("Origin"); origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin, Access-Control-Allow-Origin")
			}
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == http.MethodOptions {
				if v := r.Header.Get("Access-Control-Request-Method"); v != "" {
					w.Header().Set("Access-Control-Allow-Methods", v)
				}
				if v := r.Header.Get("Access-Control-Request-Headers"); v != "" {
					w.Header().Set("Access-Control-Allow-Headers", v)
				}
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
