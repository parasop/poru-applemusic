import { Poru, ResolveOptions, Track } from "poru";
import { fetch, Request } from "undici";
import { PORU_SECRET_TOKEN } from "./config";
import { throws } from "assert";
import { request } from "https";
const URL_PATTERN =
  /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;

interface AppleMusicOptions {
  contryCode?: string;
  imageWidth:number;
  imageHeight:number
}

export type loadType =
  | "TRACK_LOADED"
  | "PLAYLIST_LOADED"
  | "SEARCH_RESULT"
  | "NO_MATCHES"
  | "LOAD_FAILED";

export class AppleMusic {
  public baseURL: string;
  public fetchURL: string;
  public countryCode: string;
  public poru: Poru;
  private _resolve!: ({ query, source, requester }: ResolveOptions) => any;
  private token: string;
  constructor(options: AppleMusicOptions) {
    if (!options?.contryCode) {
      throw new Error(
        `[Apple Music Options] countryCode as options must be included for example us`
      );
    }
    this.countryCode = options?.contryCode;
    this.baseURL = "https://api.music.apple.com/v1/";
    this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
    this.token = `Bearer ${PORU_SECRET_TOKEN}`;
  }

  public check(url: string): boolean {
    return URL_PATTERN.test(url);
  }

  public async load(poru: Poru) {
    this.poru = poru;
    this._resolve = poru.resolve.bind(poru);
    poru.resolve = this.resolve.bind(this);
  }

  public get SourceName() {
    return "applemusic";
  }

  public async getData(params: string) {
    console.log(`${this.fetchURL}${params}`);
    let req = await fetch(`${this.fetchURL}${params}`, {
      headers: {
        Authorization: this.token,
        origin: "https://music.apple.com",
      },
    });

    let body = await req.json();

    return body;
  }

  public async resolve({ query, source, requester }: ResolveOptions) {
    if (source.toLowerCase() === "applemusic" && !this.check(query))
      return this.searchSong(query, requester);
  }

  public async searchSong(query, requester) {
    try {
      let tracks: any = await this.getData(`/search?types=songs&term=${query}`);
     console.log(tracks)
      const unresolvedTracks = await Promise.all(
        tracks.results.songs.data.map((x: any) => this.buildUnresolved(x, requester))
      );

      return this.buildResponse("TRACK_LOADED",unresolvedTracks);
    } catch (e) {
      console.log(e);
      return this.buildResponse(
        "LOAD_FAILED",
        [],
        undefined,
        e.body?.error.message ?? e.message
      );
    }
  }

  async buildUnresolved(track: any, requester: any) {
    if (!track) throw new ReferenceError("The Spotify track object was not provided");

    console.log(track.attributes)

    return new Track({
      track: "",
      info: {
        sourceName: "applemusic",
        identifier: track.id,
        isSeekable: true,
        author: track.attributes?.composerName || "Unknown Artist",
        length: track.duration_ms,
        isStream: false,
        title: track.attributes.albumName,
        uri: track.attributes.url,
        image: track.album?.images[0]?.url,
        requester,
      },
    });
  }

  buildResponse(
    loadType: loadType,
    tracks: any,
    playlistName?: string,
    exceptionMsg?: string
  ) {
    return Object.assign(
      {
        loadType,
        tracks,
        playlistInfo: playlistName ? { name: playlistName } : {},
      },
      exceptionMsg
        ? { exception: { message: exceptionMsg, severity: "COMMON" } }
        : {}
    );
  }
}
