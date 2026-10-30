
/*import { CACHE_ALBUMS, CACHE_TRACKS, GET_PLAYLISTS } from "./query";

let globalIdIndex = {
    albums: 0,
    tracks: 0,
    playlists: 0
}

let trackCacheLastFmLink;
let trackCacheSpotify;
let albumCacheLastFmLink;
let albumCacheSpotify;

export const appCacheInit = async () => {
    let totalPlaylists = await GET_PLAYLISTS();
    let totalAlbums = await CACHE_ALBUMS();
    let totalTracks = await CACHE_TRACKS();
    globalIdIndex[playlists] = totalPlaylists.length;
    globalIdIndex[albums] = totalAlbums.length;
    globalIdIndex[tracks] = totalTracks.length;

    for(let i=0; i<totalTracks.length; i++) {
        let currentTrack = totalTracks[i];
        trackCacheLastFmLink[currentTrack.last_fm_link] = currentTrack;
        trackCacheSpotify[currentTrack.track_id] = currentTrack;
    }

    for(let i=0; i<totalAlbums.length; i++) {
        let currentTrack = totalAlbums[i];
        albumCacheLastFmLink[currentTrack.last_fm_link] = currentTrack;
        albumCacheSpotify[currentTrack.album_id] = currentTrack;
    }
}

export const trackExists = (identifier) => {
    let lastFmCache = trackCacheLastFmLink[identifier];
    if(lastFmCache) return lastFmCache;
    let spotifyCache = trackCacheSpotify[identifier];
    if(spotifyCache) return spotifyCache;
    return {
        id: null
    };
}

export const albumExists = (identifier) => {
    let lastFmCache = albumCacheLastFmLink[identifier];
    if(lastFmCache) return lastFmCache;
    let spotifyCache = albumCacheSpotify[identifier];
    if(spotifyCache) return spotifyCache;
    return {
        id: null
    };
}

export const addAlbum = () => {

}

export const addUpdateTrack = (spotify_id, last_fm_link) => {
    if(spotify_id && trackCacheLastFmLink[spotify_id]) {
        trackCacheLastFmLink[spotify_id].last_fm_link = last_fm_link;
        return;
    }

    if(spotify_id) trackCacheLastFmLink[spotify_id] = {
        id: 
    }

    if(last_fm_link) trackCacheLastFmLink[spotify_id].last_fm_link = last_fm_link;
}
    */