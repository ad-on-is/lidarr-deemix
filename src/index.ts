import fetch from "node-fetch";
import Fastify from "fastify";
import _ from "lodash";
import dotenv from "dotenv";
import {
  search,
  getArtist,
  getAlbum,
  deemixArtist,
  deemixAlbum,
  deemixTracks,
} from "./deemix.js";
import { removeKeys } from "./helpers.js";

const lidarrApiUrl = "https://api.lidarr.audio";
const scrobblerApiUrl = "https://ws.audioscrobbler.com";

dotenv.config();

const fastify = Fastify({
  logger: {
    level: "error",
  },
});

async function doScrobbler(req: any, res: any) {
  let headers = req.headers;
  const u = new URL(`http://localhost${req.url}`);
  const method = req.method;

  const body = req.body?.toString();
  let status = 200;

  let nh: any = {};

  Object.entries(headers).forEach(([key, value]) => {
    if (key !== "host" && key !== "connection") {
      nh[key] = value;
    }
  });
  const url = `${u.pathname}${u.search}`;
  let data: any;
  try {
    data = await fetch(`${scrobblerApiUrl}${url}`, {
      method: method,
      body: body,
      headers: nh,
    });
    status = data.status;
  } catch (e) {
    console.error(e);
  }
  res.statusCode = status;
  res.headers = data.headers;
  let json = await data.json();

  if (process.env.OVERRIDE_MB === "true") {
    json = removeKeys(json, "mbid");
  }

  return { newres: res, data: json };
}

async function doApi(req: any, res: any) {
  let headers = req.headers;
  const u = new URL(`http://localhost${req.url}`);
  const method = req.method;

  const body = req.body?.toString();
  let status = 200;

  let nh: any = {};

  Object.entries(headers).forEach(([key, value]) => {
    if (key !== "host" && key !== "connection") {
      nh[key] = value;
    }
  });

  const url = `${u.pathname}${u.search}`;
  let data: any;
  try {
    data = await fetch(`${lidarrApiUrl}${url}`, {
      method: method,
      body: body,
      headers: nh,
    });
    status = data.status;
  } catch (e) {
    console.error(e);
  }

  let lidarr: any;
  try {
    lidarr = await data.json();
  } catch (e) {
    console.error(e);
  }
  if (url.includes("/v0.4/search")) {
    lidarr = await search(
      lidarr,
      u.searchParams.get("query") as string,
      url.includes("type=all")
    );
  }

  if (url.includes("/v0.4/artist/")) {
    if (url.includes("-aaaa-")) {
      let id = url.split("/").pop()?.split("-").pop()?.replaceAll("a", "");
      lidarr = await deemixArtist(id!);
      status = lidarr === null ? 404 : 200;
    } else {
      lidarr = await getArtist(lidarr);
      if (process.env.OVERRIDE_MB === "true") {
        // prevent refetching from musicbrainz
        status = 404;
        lidarr = {};
      }
    }
  }
  if (url.includes("/v0.4/album/")) {
    if (url.includes("-bbbb-")) {
      let id = url.split("/").pop()?.split("-").pop()?.replaceAll("b", "");
      lidarr = await getAlbum(id!);
      status = lidarr === null ? 404 : 200;
    }
  }

  data.headers.delete("content-encoding");
  console.log(status, method, url);
  res.statusCode = status;
  res.headers = data.headers;
  return { newres: res, data: lidarr };
  // return new Response(JSON.stringify(lidarr), {
  //   status: status,
  //   headers: data.headers,
  // });
}

fastify.get("*", async (req, res) => {
  let headers = req.headers;
  const host = headers["x-proxy-host"];
  if (host === "ws.audioscrobbler.com") {
    const { newres, data } = await doScrobbler(req, res);
    res = newres;
    return data;
  }
  const { newres, data } = await doApi(req, res);
  res = newres;
  return data;
});

fastify.listen({ port: 7171, host: "0.0.0.0" }, (err, address) => {
  console.log("Lidarr++Deemix running at " + address);
  if (process.env.OVERRIDE_MB === "true") {
    console.log("Overriding MusicBrainz API with Deemix API");
  }
});
