import fetch from "node-fetch";
import Fastify from "fastify";
import {
  getArtists,
  getArtist,
  getAlbums,
  getAlbum,
  deemixArtist,
} from "./deemix.js";

const lidarrApiUrl = "https://api.lidarr.audio";
const fastify = Fastify({
  logger: {
    level: "error",
  },
});
fastify.get("*", async (req, res) => {
  const u = new URL(`http://localhost${req.url}`);
  const method = req.method;
  let headers = req.headers;
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
  if (url.includes("/v0.4/search") && url.includes("type=all")) {
    lidarr = await getArtists(lidarr, u.searchParams.get("query") as string);
  }

  if (url.includes("/v0.4/artist/")) {
    if (url.includes("-aaaa-")) {
      let id = url.split("/").pop()?.split("-").pop()?.replaceAll("a", "");
      lidarr = await deemixArtist(id!);
      status = lidarr === null ? 404 : 200;
    } else {
      lidarr = await getArtist(lidarr);
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
  return lidarr;
  // return new Response(JSON.stringify(lidarr), {
  //   status: status,
  //   headers: data.headers,
  // });
});

fastify.listen({ port: 7171, host: "0.0.0.0" }, (err, address) => {
  console.log("Lidarr++Deemix running at " + address);
});
