//Use tokens fetched from global token pipeline in order to faciliate spotify queries
import { extractId, getDate, getRandomTimeout } from "./helpers.js";

//Global spotify query
async function globalSpotifyQuery(body) {
    //const AUTH = process.env.AUTH;
    //const CLIENT = process.env.CLIENT;
    //if (!tokens.TOKEN_SUCCESS) throw new Error("ERROR_MAKING_REQUEST_TO_SPOTIFY");

    const data = await fetch("https://api-partner.spotify.com/pathfinder/v2/query", {
        "headers": {
            "accept": "application/json",
            "accept-language": "en",
            "app-platform": "WebPlayer",
            "authorization": process.env.AUTH,
            "client-token": process.env.CLIENT,
            "content-type": "application/json;charset=UTF-8",
            "spotify-app-version": "1.3.4.54.gce30f964531a",
            "Referer": "https://open.spotify.com/"
        },
        "body": JSON.stringify(body),
        "method": "POST"
    });

    await new Promise((resolve) => {
        setTimeout(resolve, getRandomTimeout());
    });

    if (!data.ok) throw new Error("ERROR_MAKING_REQUEST_TO_SPOTIFY");

    return await data.json();
}

/*
//Fetch 1 track and compare to last-saved stream count. If it is different, streams have changed, so we should fetch.
export async function checkStreamsHaveChanged() {

    const data = await globalSpotifyQuery({
        "variables": {
            "uri": "spotify:track:6gZVQvQZOFpzIy3HblJ20F",
            "includeVideoAssociationItems": true
        },
        "operationName": "getTrack",
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "a8ef9e9f02b836feb0da3003c31dbb30decc6f4b473ef89ca88c882386d668de"
            }
        }
    });

    //get prev stream count
    const trackData = getTrack("6gZVQvQZOFpzIy3HblJ20F");
    const prevData = trackData?.data?.[0];
    const currentStreamCount = parseInt(data.data.trackUnion.playcount);
    const differentCount = prevData?.streams !== currentStreamCount;

    if (differentCount) {
        //intialize cron job
        cronJob();
        console.log("Initialized cron job.");
        return "SPOTIFY_HAS_UPDATED_STREAMS_CRON_JOB_STARTED";
    } else {
        console.log("Spotify has not updated streams.");
        return "SPOTIFY_HAS_NOT_UPDATED_STREAMS";
    }

}
    */

export async function fetchPlaylist(playlistId) {

    let hasMore = true;
    let offset = 0;
    let increment = 100;
    let trackData = [];

    while (hasMore) {
        const data = await globalSpotifyQuery({
            "variables": {
                "uri": "spotify:playlist:" + playlistId,
                "offset": offset,
                "limit": increment,
                "enableWatchFeedEntrypoint": true,
                "includeEpisodeContentRatingsV2": true
            },
            "operationName": "fetchPlaylist",
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "243c0ba2736f16da721e3a227004bbcdb8df6c846f198bd478172e00aa1faf42"
                }
            }
        });

        //mark playlist as unavailable
        if (data.data.playlistV2.__typename === "NotFound") {
            insertPlaylist(playlistId, 1);
            throw new Error("ERROR_PLAYLIST_DOES_NOT_EXIST_OR_IS_NOT_PUBLIC");
        }

        const tracks = data.data.playlistV2.content.items;
        for (let k = 0; k < tracks.length; k++) {
            try {
                let track = tracks[k].itemV2.data;
                trackData.push({
                    track_id: extractId(track.uri),
                    id: extractId(track.uri),
                    name: track.name,
                    cover: track.albumOfTrack.coverArt.sources[0].url,
                    album_name: track.albumOfTrack.name,
                    album_id: extractId(track.albumOfTrack.uri),
                    streams: parseInt(track.playcount),
                    date: getDate(),
                    artists: track.artists.items.map((a, i) => {
                        return {
                            name: a.profile.name,
                            id: extractId(a.uri),
                            role: i
                        }
                    })
                });
            } catch (err) {
                console.log("Caught malformed track metadata.", err);
            }
        }

        if (tracks.length < increment) hasMore = false;
        offset += increment;
    }

    return trackData;
}

/*
export async function fetchArtist(artistURI) {
    const data = await globalSpotifyQuery({
        "variables": {
            "uri": artistURI,
            "locale": "",
            "preReleaseV2": true
        },
        "operationName": "queryArtistOverview",
        "extensions": {
            "persistedQuery": {
                "version": 1,
                "sha256Hash": "9f8134ef565e78621f1e1793555bd6633c5ac144ae0f89604ed3ae3f80b3c8e6"
            }
        }
    });

    if (!data) return "error";

    if (data.data.artistUnion.__typename === "NotFound") return "error_unavailable";

    const artistStats = data.data.artistUnion.stats;

    return {
        id: extractId(artistURI),
        followers: parseInt(artistStats.followers),
        listeners: parseInt(artistStats.monthlyListeners),
        world_rank: parseInt(artistStats.worldRank),
        date: getDate()
    };

}
*/