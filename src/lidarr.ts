const lidarrApiUrl = "https://api.lidarr.audio";

export async function getLidarArtist(name: string) {
  const res = await fetch(
    `${lidarrApiUrl}/api/v0.4/search?type=all&query=${name}`
  );
  const json = (await res.json()) as [];
  const artist = json.find(
    (a) =>
      a["album"] === null &&
      (a["artist"]["artistname"] as string).toLowerCase() === name.toLowerCase()
  );
  return artist!["artist"];
}
