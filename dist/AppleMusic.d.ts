import { Poru, ResolveOptions, Track } from "poru";
interface AppleMusicOptions {
    contryCode?: string;
}
export type loadType = "TRACK_LOADED" | "PLAYLIST_LOADED" | "SEARCH_RESULT" | "NO_MATCHES" | "LOAD_FAILED";
export declare class AppleMusic {
    baseURL: string;
    fetchURL: string;
    countryCode: string;
    poru: Poru;
    private _resolve;
    private token;
    constructor(options: AppleMusicOptions);
    check(url: string): boolean;
    load(poru: Poru): Promise<void>;
    get SourceName(): string;
    getData(params: string): Promise<unknown>;
    resolve({ query, source, requester }: ResolveOptions): Promise<{
        loadType: loadType;
        tracks: any;
        playlistInfo: {
            name: string;
        } | {
            name?: undefined;
        };
    } & ({
        exception: {
            message: string;
            severity: string;
        };
    } | {
        exception?: undefined;
    })>;
    searchSong(query: any, requester: any): Promise<{
        loadType: loadType;
        tracks: any;
        playlistInfo: {
            name: string;
        } | {
            name?: undefined;
        };
    } & ({
        exception: {
            message: string;
            severity: string;
        };
    } | {
        exception?: undefined;
    })>;
    buildUnresolved(track: any, requester: any): Promise<Track>;
    buildResponse(loadType: loadType, tracks: any, playlistName?: string, exceptionMsg?: string): {
        loadType: loadType;
        tracks: any;
        playlistInfo: {
            name: string;
        } | {
            name?: undefined;
        };
    } & ({
        exception: {
            message: string;
            severity: string;
        };
    } | {
        exception?: undefined;
    });
}
export {};
