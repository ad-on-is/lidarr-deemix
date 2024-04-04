<div align="center">
<img src="./images/logo.webp" height="200" /><br />
<h1>Lidarr++Deemix</h1>
<h4 style="font-style: italic">"If Lidarr and Deemix had a child"</h4>
</div>

## 💡 How it works

Lidarr usually pulls artist and album infos from their own api <mark>api.lidarr.audio</mark>, which pulls the data from MusicBrainz.

By providing a custom proxy, we can _hook into_ the process _without modifying Lidarr itself_, and **_inject additional infos from deemix_**.

#### To do that, this image does the following things:

- Runs [mitmproxy](https://mitmproxy.org/) as a proxy (needs to be configured within Lidarr)
- The proxy then **_redirects all_** <mark>api.lidarr.audio</mark> calls to an internally running **NodeJS service**
- Executes `update-ca-certificates` within the Lidarr-container, to trust the proxy certificates

## 💻️ Installation

- Use the provided [docker-compose.yml](./docker-compose.yml) as an example.
  - **LIDARR_CONTAINER** the name of the Lidarr container
  - **DEEMIX_ARL** your deezer ARL (get it from your browsers cookies)
- Go to **Lidarr -> Settings -> General** and set the proxy to `lidarr-deemix` and port **8080**

![settings](./images/lidarr-deemix-conf.png)

> [!NOTE]
> The folder `/lidarr-deemix-certs` must be mounted to `/usr/local/share/ca-certificates` within the Lidarr container.

> Also `/var/run/docker.sock/` is needed, so lidarr-deemix can connect to lidarr and execute `update-ca-certificates`. If this is an issue, you have to manually execute that command, each time you restart the Lidarr container.
