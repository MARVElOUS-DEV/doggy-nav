#!/bin/sh
set -eu

escape_js_string() {
  printf '%s' "${1-}" | sed 's/\\/\\\\/g; s/"/\\"/g; :a;N;$!ba;s/\n/\\n/g'
}

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__DOGGY_NAV_RUNTIME_CONFIG__ = {
  UMI_APP_COPY_RIGHT_TEXT: "$(escape_js_string "${UMI_APP_COPY_RIGHT_TEXT-}")",
  UMI_APP_IMAGE_SERVICE_URL: "$(escape_js_string "${UMI_APP_IMAGE_SERVICE_URL-}")"
};
EOF
