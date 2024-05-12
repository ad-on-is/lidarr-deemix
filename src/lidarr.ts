import { normalize } from "./helpers.js";

const lidarrApiUrl = "https://api.lidarr.audio";

export async function getLidarArtist(name: string) {
  const res = await fetch(
    `${lidarrApiUrl}/api/v0.4/search?type=all&query=${name}`
  );
  const json = (await res.json()) as [];
  const a = json.find(
    (a) =>
      a["album"] === null &&
      typeof a["artist"] !== "undefined" &&
      normalize(a["artist"]["artistname"]) === normalize(name)
  );
  if (typeof a !== "undefined") {
    return a["artist"];
  }
  return null;
}

export async function getAllLidarrArtists() {
  const res = await fetch(`${process.env.LIDARR_URL}/api/v1/artist`, {
    headers: { "X-Api-Key": process.env.LIDARR_API_KEY as string },
  });
  const json = (await res.json()) as [];
  return json;
}
