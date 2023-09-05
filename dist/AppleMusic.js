"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMusic = void 0;
const poru_1 = require("poru");
const undici_1 = require("undici");
const config_1 = require("./config");
const URL_PATTERN = /(?:https:\/\/music\.apple\.com\/)([a-z]{2}\/)?(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/;
class AppleMusic extends poru_1.Plugin {
    baseURL;
    fetchURL;
    countryCode;
    poru;
    imageWidth;
    imageHeight;
    _resolve;
    token;
    constructor(options) {
        super("applemusic");
        if (!options?.contryCode) {
            throw new Error(`[Apple Music Options] countryCode as options must be included for example us`);
        }
        this.countryCode = options?.contryCode;
        this.baseURL = "https://api.music.apple.com/v1/";
        this.fetchURL = `https://amp-api.music.apple.com/v1/catalog/${this.countryCode}`;
        this.token = `Bearer ${config_1.PORU_SECRET_TOKEN}`;
        this.imageWidth = options.imageWidth || 900;
        this.imageHeight = options.imageHeight || 500;
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
        if (source === "applemusic" && !this.check(query))
            return this.searchSong(query, requester);
        if (!this.check(query))
            return this._resolve({ query, source: this.poru.options.defaultPlatform, requester: requester });
        let [, , type] = await URL_PATTERN.exec(query);
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
    async getPlaylist(url, requester) {
        let query = new URL(url).pathname.split("/");
        let id = query.pop();
        try {
            const playlist = await this.getData(`/playlists/${id}`);
            const name = playlist.data[0].attributes.name;
            const tracks = playlist.data[0]?.relationships.tracks.data;
            const unresolvedTracks = await Promise.all(await tracks.map((x) => this.buildUnresolved(x, requester)));
            return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks, name);
        }
        catch (e) {
            return this.buildResponse("LOAD_FAILED", [], undefined, e.body?.error.message ?? e.message);
        }
    }
    async getArtist(url, requester) {
        let query = new URL(url).pathname.split("/");
        let id = query.pop();
        try {
            const artist = await this.getData(`/artists/${id}/view/top-songs`);
            const name = `${artist.data[0].attributes.artistName}'s top songs`;
            const tracks = await artist.data;
            const unresolvedTracks = await Promise.all(await tracks.map((x) => this.buildUnresolved(x, requester)));
            return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks, name);
        }
        catch (e) {
            return this.buildResponse("LOAD_FAILED", [], undefined, e.body?.error.message ?? e.message);
        }
    }
    async getAlbum(url, requester) {
        let query = new URL(url).pathname.split("/");
        let id = query.pop();
        try {
            let album = await this.getData(`/albums/${id}`);
            const name = album.data[0].attributes.name;
            const tracks = await album.data[0].relationships.tracks.data;
            const unresolvedTracks = await Promise.all(await tracks.map((x) => this.buildUnresolved(x, requester)));
            return this.buildResponse("PLAYLIST_LOADED", unresolvedTracks, name);
        }
        catch (e) {
            return this.buildResponse("LOAD_FAILED", [], undefined, e.body?.error.message ?? e.message);
        }
    }
    async searchSong(query, requester) {
        try {
            let tracks = await this.getData(`/search?types=songs&term=${query}`);
            const unresolvedTracks = await Promise.all(tracks.results.songs.data.map((x) => this.buildUnresolved(x, requester)));
            return this.buildResponse("TRACK_LOADED", [unresolvedTracks]);
        }
        catch (e) {
            return this.buildResponse("LOAD_FAILED", [], undefined, e.body?.error.message ?? e.message);
        }
    }
    async buildUnresolved(track, requester) {
        if (!track)
            throw new ReferenceError("The AppleMusic track object was not provided");
        const artworkURL = new String(track.attributes.artwork.url)
            .replace("{w}", String(this.imageWidth))
            .replace("{h}", String(this.imageHeight));
        return new poru_1.Track({
            track: "",
            info: {
                sourceName: "applemusic",
                identifier: track.id,
                isSeekable: true,
                author: track.attributes?.composerName ||
                    track.attributes?.recordLabel ||
                    "Unknown Artist",
                length: track.attributes.durationInMillis || 0,
                isStream: false,
                title: track.attributes.name,
                uri: track.attributes.url,
                image: artworkURL,
            },
        }, requester);
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