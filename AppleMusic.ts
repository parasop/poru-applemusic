import { Poru, ResolveOptions, Track, Plugin } from "poru";
import { fetch, Request } from "undici";
import { PORU_SECRET_TOKEN } from "./config";
const URL_PATTERN = /(?:https:\/\/music\.apple\.com\/)([a-z]{2}\/)?(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;

interface AppleMusicOptions {
  contryCode?: string;
  imageWidth: number;
  imageHeight: number;
}

export type loadType =
  | "TRACK_LOADED"
  | "PLAYLIST_LOADED"
  | "SEARCH_RESULT"
  | "NO_MATCHES"
  | "LOAD_FAILED";

export class AppleMusic extends Plugin {
  public baseURL: string;
  public fetchURL: string;
  public countryCode: string;
  public poru: Poru;
  public imageWidth: number;
  public imageHeight: number;
  private _resolve!: ({ query, source, requester }: ResolveOptions) => any;
  private token: string;
  constructor(options: AppleMusicOptions) {
    super("applemusic");
    if (!options?.contryCode) {
      throw new Error(
        `[Apple Music Options] countryCode as options must be included for example us`
      );
    }
    this.countryCode = options?.contryCode;
    this.baseURL = "https://api.music.apple.com/v1/";
    this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
    this.token = `Bearer ${PORU_SECRET_TOKEN}`;
    this.imageWidth = options.imageWidth || 900;
    this.imageHeight = options.imageHeight || 500;
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
    if (source === "applemusic" && !this.check(query)) return this.searchSong(query, requester);

      if(!this.check(query))return this._resolve({ query, source: this.poru.options.defaultPlatform, requester: requester })
    
    let [,,type] = await URL_PATTERN.exec(query);
    switch (type) {
      case "album": {
        return this.getAlbum(query, requester);
      }
      case "playlist": {
        return this.getPlaylist(query, requester);
      }
      case "artist": {
        return this.getArtist(query, requester);
      }
    }
  
  }

  public async getPlaylist(url, requester) {
    let query = new URL(url).pathname.split("/");
    let id = query.pop();
    try {
      const playlist: any = await this.getData(`/playlists/${id}`);
      const name = playlist.data[0].attributes.name;
      const tracks = playlist.data[0]?.relationships.tracks.data;
      const unresolvedTracks = await Promise.all(
        await tracks.map((x) => this.buildUnresolved(x, requester))
      );

      return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks, name);
    } catch (e) {
      return this.buildResponse(
        "LOAD_FAILED",
        [],
        undefined,
        e.body?.error.message ?? e.message
      );
    }
  }

  public async getArtist(url, requester) {
    let query = new URL(url).pathname.split("/");
    let id = query.pop();
    try {
      const artist: any = await this.getData(`/artists/${id}/view/top-songs`);
      const name = `${artist.data[0].attributes.artistName}'s top songs`;
      const tracks = await artist.data;
      const unresolvedTracks = await Promise.all(
        await tracks.map((x) => this.buildUnresolved(x, requester))
      );

      return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks, name);
    } catch (e) {
      return this.buildResponse(
        "LOAD_FAILED",
        [],
        undefined,
        e.body?.error.message ?? e.message
      );
    }
  }

  public async getAlbum(url, requester) {
    let query = new URL(url).pathname.split("/");
    let id = query.pop();
    try {
      let album: any = await this.getData(`/albums/${id}`);
      const name = album.data[0].attributes.name;
         
      const tracks = await album.data[0].relationships.tracks.data;

      const unresolvedTracks = await Promise.all(
        await tracks.map((x) => this.buildUnresolved(x, requester))
      );

      return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks,name);
    } catch (e) {
      return this.buildResponse(
        "LOAD_FAILED",
        [],
        undefined,
        e.body?.error.message ?? e.message
      );
    }
  }

  public async searchSong(query, requester) {
    try {
      let tracks: any = await this.getData(`/search?types=songs&term=${query}`);
      const unresolvedTracks = await Promise.all(
        tracks.results.songs.data.map((x: any) =>
          this.buildUnresolved(x, requester)
        )
      );

      return this.buildResponse("TRACK_LOADED",[unresolvedTracks]);
    } catch (e) {
      return this.buildResponse(
        "LOAD_FAILED",
        [],
        undefined,
        e.body?.error.message ?? e.message
      );
    }
  }

  async buildUnresolved(track: any, requester: any) {
    if (!track)
      throw new ReferenceError("The AppleMusic track object was not provided");

    const artworkURL = new String(track.attributes.artwork.url)
      .replace("{w}", String(this.imageWidth))
      .replace("{h}", String(this.imageHeight));

    return new Track(
      {
        track: "",
        info: {
          sourceName: "applemusic",
          identifier: track.id,
          isSeekable: true,
          author:
            track.attributes?.composerName ||
            track.attributes?.recordLabel ||
            "Unknown Artist",
          length: track.attributes.durationInMillis || 0,
          isStream: false,
          title: track.attributes.name,
          uri: track.attributes.url,
          image: artworkURL,
        },
      },
      requester
    );
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
