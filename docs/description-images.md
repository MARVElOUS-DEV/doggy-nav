# Description images

When an image service is configured, web and admin editors store the uploaded
object's path in Markdown, for example:

```markdown
![image](/images/user-1/example_com_20261005000000_photo_png)
```

The image host is added only when rendering. Configure both frontends to use the
current image service:

```env
# Main web app (set before building)
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.doggy-nav.marvelous.pp.ua

# Admin (runtime container environment for Docker; build environment otherwise)
UMI_APP_IMAGE_SERVICE_URL=https://images.doggy-nav.marvelous.pp.ua
```

The main app embeds its public environment variables at build time, so rebuild
and deploy it after changing the host. Restart the admin Docker container to
regenerate `/runtime-config.js`; other admin deployments need a rebuild.

For a Docker main build, pass
`--build-arg NEXT_PUBLIC_IMAGE_SERVICE_URL=https://images.doggy-nav.marvelous.pp.ua`.
The Docker publish workflow reads the same GitHub repository variable. The admin
Pages workflow reads `UMI_APP_IMAGE_SERVICE_URL` from GitHub variables when building.

When rendering existing absolute image URLs, the renderer extracts their
`/images/<user>/<file>` storage path and adds the configured image host. No previous
hosts need to be recorded in code or configuration. URLs outside this storage-path
format are preserved. This restores existing descriptions without a database
migration. The storage keys
and image objects must remain available at the new host. Normal links and Markdown
source are preserved. Absolute URLs matching the uploaded-image path format are
treated as service images regardless of their original host.

Without an image service configured, uploads continue to insert the absolute URL
returned by the backend. Both backends and the standalone upload service retain
their existing response format, including `url` and `key`.
