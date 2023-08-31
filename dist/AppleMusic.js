"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusic = void 0;
const poru_1 = require("poru");
const undici_1 = require("undici");
const config_1 = require("./config");
const URL_PATTERN = /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
class AppleMusic {
    baseURL;
    fetchURL;
    countryCode;
    poru;
    _resolve;
    token;
    constructor(options) {
        if (!options?.contryCode) {
            throw new Error(`[Apple Music Options] countryCode as options must be included for example us`);
        }
        this.countryCode = options?.contryCode;
        this.baseURL = "https://api.music.apple.com/v1/";
        this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
        this.token = `Bearer ${config_1.PORU_SECRET_TOKEN}`;
    }
    check(url) {
        return URL_PATTERN.test(url);
    }
    async load(poru) {
        this.poru = poru;
        this._resolve = poru.resolve.bind(poru);
        poru.resolve = this.resolve.bind(this);
    }
    get SourceName() {
        return "applemusic";
    }
    async getData(params) {
        console.log(`${this.fetchURL}${params}`);
        let req = await (0, undici_1.fetch)(`${this.fetchURL}${params}`, {
            headers: {
                Authorization: this.token,
                origin: "https://music.apple.com",
            },
        });
        let body = await req.json();
        return body;
    }
    async resolve({ query, source, requester }) {
        if (source.toLowerCase() === "applemusic" && !this.check(query))
            return this.searchSong(query, requester);
    }
    async searchSong(query, requester) {
        try {
            let tracks = await this.getData(`/search?types=songs&term=${query}`);
            console.log(tracks);
            const unresolvedTracks = await Promise.all(tracks.results.songs.data.map((x) => this.buildUnresolved(x, requester)));
            return this.buildResponse("TRACK_LOADED", unresolvedTracks);
        }
        catch (e) {
            console.log(e);
            return this.buildResponse("LOAD_FAILED", [], undefined, e.body?.error.message ?? e.message);
        }
    }
    async buildUnresolved(track, requester) {
        if (!track)
            throw new ReferenceError("The Spotify track object was not provided");
        console.log(track.attributes);
        return new poru_1.Track({
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
    buildResponse(loadType, tracks, playlistName, exceptionMsg) {
        return Object.assign({
            loadType,
            tracks,
            playlistInfo: playlistName ? { name: playlistName } : {},
        }, exceptionMsg
            ? { exception: { message: exceptionMsg, severity: "COMMON" } }
            : {});
    }
}
exports.AppleMusic = AppleMusic;
//# sourceMappingURL=AppleMusic.js.map