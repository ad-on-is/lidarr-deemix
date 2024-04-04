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
