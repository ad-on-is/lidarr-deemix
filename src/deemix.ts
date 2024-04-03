import _ from "lodash";
const deemixUrl = "http://127.0.0.1:7272";
import { getLidarArtist } from "./lidarr.js";

function fakeId(id: any, type: string) {
  let p = "a";
  if (type === "album") {
    p = "b";
  }
  if (type === "track") {
    p = "c";
  }
  if (type === "release") {
    p = "d";
  }
  if (type === "recording") {
    p = "e";
  }
  id = `${id}`;
  id = id.padStart(12, p);

  return `${"".padStart(8, p)}-${"".padStart(4, p)}-${"".padStart(
    4,
    p
  )}-${"".padStart(4, p)}-${id}`;
}

async function deemixArtists(name: string): Promise<[]> {
  const data = await fetch(
    `${deemixUrl}/search/artists?limit=100&offset=0&q=${name}`
  );
  const j = (await data.json()) as any;
  return j["data"] as [];
}

async function deemixAlbum(id: string): Promise<any> {
  const data = await fetch(`${deemixUrl}/albums/${id}`);
  const j = (await data.json()) as any;
  return j;
}

export async function deemixArtist(id: string): Promise<any> {
  const data = await fetch(`${deemixUrl}/artists/${id}`);
  const j = (await data.json()) as any;

  return {
    Albums: [
      ...j["albums"]["data"].map((a: any) => ({
        Id: fakeId(a["id"], "album"),
        OldIds: [],
        ReleaseStatuses: ["Official"],
        SecondaryTypes: a["title"].toLowerCase().includes("live")
          ? ["Live"]
          : [],
        Title: a["title"],
        Type: "Album",
      })),
    ],
    artistaliases: [],
    artistname: j["name"],
    sortname: j["name"],
    disambiguation: "",
    status: "active",
    overview: "",
    rating: { Count: 0, Value: null },
    genres: [],
    id: `${fakeId(j["id"], "artist")}`,
    images: [{ CoverType: "Poster", Url: j["picture_xl"] }],
    links: [
      {
        target: "https://www.divanhana.ba/",
        type: "divanhana",
      },
      {
        target: "https://www.discogs.com/artist/3876876",
        type: "discogs",
      },
    ],
    type: "Artist",
  };
}

async function deemixAlbums(name: string): Promise<any[]> {
  let total = 0;
  let start = 0;
  const data = await fetch(
    `${deemixUrl}/search/albums?limit=1&offset=0&q=${name}`
  );

  const j = (await data.json()) as any;
  total = j["total"] as number;

  const albums: any[] = [];
  while (start < total) {
    const data = await fetch(
      `${deemixUrl}/search/albums?limit=100&offset=${start}&q=${name}`
    );
    const j = (await data.json()) as any;
    albums.push(...(j["data"] as []));
    start += 100;
  }

  return albums.filter(
    (a) =>
      a["artist"]["name"].toLowerCase() === name.toLowerCase() ||
      a["artist"]["name"] === "Verschillende artiesten"
  );
}

export async function getAlbum(id: string) {
  const d = await deemixAlbum(id);
  const lidarr = await getLidarArtist(d["artist"]["name"]);
  return {
    aliases: [],
    artistid: lidarr["id"],
    artists: [lidarr],
    disambiguation: "",
    genres: [],
    id: `${fakeId(d["id"], "album")}`,
    images: [{ CoverType: "Cover", Url: d["cover_xl"] }],
    links: [],
    oldids: [],
    overview: "",
    rating: { Count: 0, Value: null },
    releasedate: d["release_date"],
    releases: [
      {
        country: ["Germany"],
        disambiguation: "",
        id: `${fakeId(d["id"], "release")}`,
        label: [d["label"]],
        media: [
          {
            Format: "CD",
            Name: "",
            Position: 1,
          },
        ],
        oldids: [],
        releasedate: d["release_date"],
        status: "Official",
        title: d["title"],
        track_count: d["nb_tracks"],
        tracks: d["tracks"]["data"].map((t: any, idx: number) => ({
          artistid: lidarr["id"],
          durationms: t["duration"] * 1000,
          id: `${fakeId(t["id"], "track")}`,
          mediumnumber: 1,
          oldids: [],
          oldrecordingids: [],
          recordingid: fakeId(t["id"], "recording"),
          trackname: t["title"],
          tracknumber: `${idx + 1}`,
          trackposition: idx + 1,
        })),
      },
    ],
    secondarytypes: d["title"].toLowerCase().includes("live") ? ["Live"] : [],
    title: d["title"],
    type: "Album",
  };
}

export async function getAlbums(name: string, existing: any[] = []) {
  let dalbums = await deemixAlbums(name);

  dalbums = dalbums.filter((a) => !existing.includes(a["title"]));
  let dtoRalbums = dalbums.map((d) => ({
    Id: `${fakeId(d["id"], "album")}`,
    OldIds: [],
    ReleaseStatuses: ["Official"],
    SecondaryTypes: [],
    Title: d["title"],
    LowerTitle: d["title"].toLowerCase(),
    Type: "Album",
  }));

  dtoRalbums = _.uniqBy(dtoRalbums, "LowerTitle");

  return dtoRalbums;
}

export async function getArtists(lidarr: any, query: string) {
  const dartists = await deemixArtists(query);
  let lartist;
  let lidx = -1;
  let didx = -1;
  for (const [i, artist] of lidarr.entries()) {
    if (artist["album"] === null) {
      lartist = artist;
      lidx = i;
      break;
    }
  }
  if (lartist) {
    let dartist;
    for (const [i, d] of dartists.entries()) {
      if (
        (lartist["artist"]["artistname"] as string).toLowerCase() ===
        (d["name"] as string).toLowerCase()
      ) {
        dartist = d;
        didx = i;
        break;
      }
    }
    if (dartist) {
      let posterFound = false;
      for (const img of lartist["artist"]["images"] as any[]) {
        if (img["CoverType"] === "Poster") {
          posterFound = true;
          break;
        }
      }
      if (!posterFound) {
        (lartist["artist"]["images"] as any[]).push({
          CoverType: "Poster",
          Url: dartist["picture_xl"],
        });
      }
      lartist["artist"]["oldids"].push(fakeId(dartist["id"], "artist"));
    }

    lidarr[lidx] = lartist;
  }

  if (didx > -1) {
    dartists.splice(didx, 1);
  }

  const dtolartists = dartists.map((d) => ({
    album: null,
    artist: {
      artistaliases: [],
      artistname: d["name"],
      sortname: d["name"],
      genres: [],
      id: `${fakeId(d["id"], "artist")}`,
      images: [
        {
          CoverType: "Poster",
          Url: d["picture_xl"],
        },
        {
          CoverType: "Banner",
          Url: d["picture_xl"],
        },
        {
          CoverType: "Fanart",
          Url: d["picture_xl"],
        },
        {
          CoverType: "Logo",
          Url: d["picture_xl"],
        },
      ],
      links: [],
      type:
        (d["type"] as string).charAt(0).toUpperCase() +
        (d["type"] as string).slice(1),
    },
  }));

  lidarr = [...lidarr, ...dtolartists];

  return lidarr;
}

async function getAritstByName(name: string) {
  const artists = await deemixArtists(name);
  const artist = artists.find(
    (a) => (a["name"] as string).toLowerCase() === name.toLowerCase()
  );
  return artist;
}

export async function getArtist(lidarr: any) {
  const artist = await getAritstByName(lidarr["artistname"]);
  let posterFound = false;
  for (const img of lidarr["images"] as any[]) {
    if (img["CoverType"] === "Poster") {
      posterFound = true;
      break;
    }
  }
  if (!posterFound) {
    (lidarr["images"] as any[]).push({
      CoverType: "Poster",
      Url: artist!["picture_xl"],
    });
  }

  const albums = await getAlbums(
    lidarr["artistname"],
    lidarr["Albums"].map((a: any) => a["Title"])
  );
  lidarr["Albums"] = [...lidarr["Albums"], ...albums];
  return lidarr;
}
