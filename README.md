<div align="center">
<img src="./images/logo.webp" height="200" /><br />
<h1>Lidarr++Deemix</h1>
<h4 style="font-style: italic">"If Lidarr and Deemix had a child"</h4>
</div>

## 💡 How it works

Lidarr usually pulls artist and album infos from their own api api.lidarr.audio, which pulls the data from MusicBrainz.

However, MusicBrainz does not have many albums, especially for some regional _nieche_ artist.

This tool helps to enrich Lidarr, by providing a custom proxy, that _hooks into_ the process _without modifying Lidarr itself_, and **_injects additional albums from deemix_**.

#### To do that, the following steps are performed:

- [mitmproxy](https://mitmproxy.org/) runs as a proxy
- Lidarr needs to be configured to use that proxy.
- The proxy then **_redirects all_** api.lidarr.audio calls to an internally running **NodeJS service** (_127.0.0.1:7171_)
- That NodeJS service **enriches** the artists albums with the ones found in deemix
- Lidarr has now additiona albums, and can do its thing.
- Currently only albums are supported - _you can not import artists, that are not in MusicBrainz_

## 💻️ Installation

- Use the provided [docker-compose.yml](./docker-compose.yml) as an example.
  - **LIDARR_CONTAINER** the name of the Lidarr container
  - **DEEMIX_ARL** your deezer ARL (get it from your browsers cookies)
- Go to **Lidarr -> Settings -> General** and set the proxy to `lidarr-deemix` and port **8080**

![settings](./images/lidarr-deemix-conf.png)

> [!NOTE]
> The folder `/lidarr-deemix-certs` must be mounted to `/usr/local/share/ca-certificates` within the Lidarr container.

> Also `/var/run/docker.sock/` is needed, so lidarr-deemix can connect to lidarr and execute `update-ca-certificates`. If this is an issue, you have to manually execute that command, each time you restart the Lidarr container.
