# Troubleshooting

If you're a developer or tinkerer, this one is for you.

## Local testing

The easiest way to test locally is to:

- Clone Lidarr
- Build Lidarr
- Clone this repo
- Install mitmproxy
- Run Lidarr and this repo locally

### 1 Clone and Build Lidarr

You need `dotnet` installed for this. See [Lidarr contribution guide](https://wiki.servarr.com/lidarr/contributing) for further information.

```bash
git clone https://github.com/Lidarr/Lidarr.git
cd Lidarr
dotnet msbuild -restore src/Lidarr.sln -p:Configuration=Debug -p:Platform=Posix -t:PublishAllRids
# grab a coffee
```

### 2 Clone this repo and install deps

You'll need **python, nodejs, pnpm** for this one. Also, download and install [mitmproxy](https://mitmproxy.org/) on your system.

```bash
git clone git@github.com:ad-on-is/lidarr-deemix.git
cd lidarr-deemix
pnpm i
python -m pip install -r python/requirements.txt
```

### 3 Run

```bash
# terminal 1 (lidarr-deemix):
pnpm run dev
# terminal 2 (lidarr-deemix):
DEEMIX_ARL=xxxx python ./python/deemix-server.py #
# terminal 3 (lidarr-deemix):
mitmweb -s ./python/http-redirect-requests.py # this will open a new browser, where you can inspect the requests from lidarr.

# terminal 4 (Lidarr)
./_output/net6.0/linux-x64/Lidarr # this will open a new browser
```
