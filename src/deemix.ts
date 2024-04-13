import _ from "lodash";
const deemixUrl = "http://127.0.0.1:7272";
import { getLidarArtist } from "./lidarr.js";
import { titleCase, normalize } from "./helpers.js";

function fakeId(id: any, type: string) {
  // artist
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
        Type: getType(a["record_type"]),
      })),
    ],
    artistaliases: [],
    artistname: j["name"],
    disambiguation: "",

    genres: [],
    id: `${fakeId(j["id"], "artist")}`,
    images: [{ CoverType: "Poster", Url: j["picture_xl"] }],
    links: [
      {
        target: j["link"],
        type: "deezer",
      },
    ],
    oldids: [],
    overview: "!!--Imported from Deemix--!!",
    rating: { Count: 0, Value: null },
    sortname: (j["name"] as string).split(" ").reverse().join(", "),
    status: "active",
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
      normalize(a["artist"]["name"]) === normalize(name) ||
      a["artist"]["name"] === "Verschillende artiesten"
  );
}

function getType(rc: string) {
  let type = rc.charAt(0).toUpperCase() + rc.slice(1);

  if (type === "Ep") {
    type = "EP";
  }
  return type;
}

export async function getAlbum(id: string) {
  const d = await deemixAlbum(id);

  let lidarr: any = await getLidarArtist(d["artist"]["name"]);
  if (lidarr === null || process.env.OVERRIDE_MB === "true") {
    lidarr = {
      id: fakeId(d["artist"]["id"], "artist"),
      artistaliases: [],
      artistname: d["artist"]["name"],
      disambiguation: "",
      overview: "!!--Imported from Deemix--!!",
      genres: [],
      images: [],
      links: [],
      oldids: [],
      sortname: (d["artist"]["name"] as string).split(" ").reverse().join(", "),
      status: "active",
      type: "Artist",
    };
  }

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
    overview: "!!--Imported from Deemix--!!",
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
        title: titleCase(d["title"]),
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
    title: titleCase(d["title"]),
    type: getType(d["record_type"]),
  };
}

export async function getAlbums(name: string) {
  const dalbums = await deemixAlbums(name);

  let dtoRalbums = dalbums.map((d) => ({
    Id: `${fakeId(d["id"], "album")}`,
    OldIds: [],
    ReleaseStatuses: ["Official"],
    SecondaryTypes: d["title"].toLowerCase().includes("live") ? ["Live"] : [],
    Title: titleCase(d["title"]),
    LowerTitle: d["title"].toLowerCase(),
    Type: getType(d["record_type"]),
  }));

  dtoRalbums = _.uniqBy(dtoRalbums, "LowerTitle");

  return dtoRalbums;
}

export async function getArtists(
  lidarr: any,
  query: string,
  isManual: boolean = true
) {
  const dartists = await deemixArtists(query);

  let lartist;
  let lidx = -1;
  let didx = -1;
  if (process.env.OVERRIDE_MB !== "true") {
    for (const [i, artist] of lidarr.entries()) {
      if (artist["album"] === null) {
        lartist = artist;
        lidx = i;
        break;
      }
    }
  }
  if (lartist) {
    let dartist;
    for (const [i, d] of dartists.entries()) {
      if (normalize(lartist["artist"]["artistname"]) === normalize(d["name"])) {
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

  let dtolartists: any[] = dartists.map((d) => ({
    artist: {
      artistaliases: [],
      artistname: d["name"],
      sortname: (d["name"] as string).split(" ").reverse().join(", "),
      genres: [],
      id: `${fakeId(d["id"], "artist")}`,
      images: [
        {
          CoverType: "Poster",
          Url: d["picture_xl"],
        },
      ],
      links: [
        {
          target: d["link"],
          type: "deezer",
        },
      ],
      type:
        (d["type"] as string).charAt(0).toUpperCase() +
        (d["type"] as string).slice(1),
    },
  }));

  if (!isManual) {
    dtolartists = dtolartists.map((a) => a.artist);
    if (process.env.OVERRIDE_MB === "true") {
      dtolartists = [
        dtolartists.filter((a) => {
          return (
            normalize(a["artistname"]) === normalize(decodeURIComponent(query))
          );
        })[0],
      ];
    }
  }

  lidarr = [...lidarr, ...dtolartists];

  if (process.env.OVERRIDE_MB === "true") {
    lidarr = dtolartists;
  }

  return lidarr;
}

async function getAritstByName(name: string) {
  const artists = await deemixArtists(name);
  const artist = artists.find((a) => normalize(a["name"]) === normalize(name));
  return artist;
}

export async function getArtist(lidarr: any) {
  const artist = await getAritstByName(lidarr["artistname"]);
  if (typeof artist === "undefined") {
    return lidarr;
  }
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

  const albums = await getAlbums(lidarr["artistname"]);
  const existing = albums.map((a: any) => normalize(a["Title"]));
  if (process.env.OVERRIDE_MB === "true") {
    lidarr["images"] = [
      {
        CoverType: "Poster",
        Url: artist!["picture_xl"],
      },
    ];
    lidarr["Albums"] = albums;
  } else {
    if (process.env.PRIO_DEEMIX === "true") {
      lidarr["Albums"] = [
        ...lidarr["Albums"].filter(
          (a: any) => !existing.includes(normalize(a["Title"]))
        ),
        ...albums,
      ];
    } else {
      lidarr["Albums"] = [
        ...lidarr["Albums"],
        ...albums.filter((a) => !existing.includes(normalize(a["Title"]))),
      ];
    }
  }

  return lidarr;
}

//
