
import { getDate } from "./helpers.js";
import { GET_PLAYLISTS, TRANSACTION_QUERY } from "./query.js";
import { fetchPlaylist } from "./spotify.js";

//cron job
export async function cronJob() {
    //cronJobRunning = true;

    const allPlaylists = await GET_PLAYLISTS();
    for (let i = 0; i < allPlaylists.length; i++) {
        let playlistId = allPlaylists[i].id;
        console.log(playlistId)
        try {

            /*
            insertJob({
                id: "DailyIndividualPlaylistJob:" + playlistId,
                in_progress: 1,
                success: null,
                job_last_ran_ms: null,
                context: "IN_PROGRESS"
            });
            */

            const data = await fetchPlaylist(playlistId);
            //let artists = new Set();
            let queries = [

            ];

            let placeholders1 = [];
            let placeholders2 = [];
            let placeholders3 = [];
            let vals1 = [];
            let vals2 = [];
            let vals3 = [];

            data.forEach((t, l) => {

                let base1 = l * 2;
                let base2 = l * 3;
                let base3 = l * 4;
                placeholders1.push(`($${base1 + 1}, $${base1 + 2})`);
                placeholders2.push(`($${base2 + 1}, $${base2 + 2}, $${base2 + 3})`);
                placeholders3.push(`($${base3 + 1}, $${base3 + 2}, $${base3 + 3}, $${base3 + 4})`);

                vals2.push(t.id, t.streams, getDate());
                vals1.push(t.id, playlistId);
                vals3.push(t.id, t.name, t.artists[0].name, "");
                /*
                t.artists.forEach(a => {
                    artists.add(a.id)
                });
                */
            });

            queries.push({ text: `INSERT INTO playlist_track (track_id, playlist_id) VALUES ${placeholders1.join(", ")} ON CONFLICT (track_id, playlist_id) DO NOTHING;`, values: vals1 });
            queries.push({ text: `INSERT INTO stream_snapshots (id, streams, date) VALUES ${placeholders2.join(", ")} ON CONFLICT (id, date) DO NOTHING;`, values: vals2 });
            queries.push({ text: `INSERT INTO tracks (id, name, first_artist_name, last_fm_link) VALUES ${placeholders3.join(", ")} ON CONFLICT (id) DO NOTHING;`, values: vals3 });

            await TRANSACTION_QUERY(queries);

            //insertArtists([...artists]);
            //insertPlaylistTracks(data.map(t => { return { track_id: t.id, playlist_id: spotifty_id } }))

            //if (data === "error") insertRetryQueue(playlistURI, 0);

            /*
            insertJob({
                id: "DailyIndividualPlaylistJob:" + playlistId,
                in_progress: 0,
                success: 1,
                job_last_ran_ms: Date.now(),
                context: "SUCCESS"
            });
            */

        } catch (err) {
            console.log("Error", err.message, err);
        }
    }

    /*
    insertJob({
        id: "DailyGlobalPlaylistJob",
        in_progress: 0,
        success: 1,
        job_last_ran_ms: Date.now(),
        context: "JOB_FINISHED_CHECK_INDIVIDUAL_STATUS_FOR_POSSIBLE_ERRORS"
    });
    */

    /*
    No efficient way to fetch artist stats.
    const allArtists = getArtists();
    let artistList = [];

    for (let i = 0; i < allArtists.length; i++) {
        let artistId = allArtists[i].id;
        let artistURI = "spotify:artist:" + artistId;
        const data = await fetchArtist(artistURI);

        if (data === "error") {
            console.log("error")
            insertRetryQueue(artistURI, 0);
            return;
        }

        if (data === "error_unavailable") {
            console.log("Artist Not Found");
            return;
        }

        artistList.push(data);
        

    }
    */

    //insertArtistDatapoints(artistList);

    //insertJob(globalCronJobId, 1, "All playlists and artists have been processed. Any playlists/artists that have recieved errors fetching can be found via the retry log.");
    /*cronJobRunning = Date.now();*/
}
/*
export async function streamChangeJob() {

    lastStreamCheckJobAt = Date.now();

    insertJob({
        id: "checkStreamsHaveChangedJob",
        in_progress: 1,
        success: null,
        job_last_ran_ms: null,
        context: "IN_PROGRESS"
    });

    try {
        const data = await checkStreamsHaveChanged();
        insertJob({
            id: "checkStreamsHaveChangedJob",
            in_progress: 0,
            success: 1,
            job_last_ran_ms: Date.now(),
            context: data
        });
    } catch (err) {
        insertJob({
            id: "checkStreamsHaveChangedJob:" + playlistId,
            in_progress: 0,
            success: 0,
            job_last_ran_ms: Date.now(),
            context: err.message
        });
    }

}
/*
export async function processPlaylistJob(spotifty_id) {

    try {
        
        insertJob({
            id: "ImportOrManualReRunIndividualPlaylistJob:" + spotifty_id,
            in_progress: 1,
            success: null,
            job_last_ran_ms: null,
            context: "IN_PROGRESS"
        });
        

        const data = await fetchPlaylist(spotifty_id);

        insertStreamDatapoints(data);
        let artists = new Set();
        data.forEach(t => {
            t.artists.forEach(a => {
                artists.add(a.id)
            });
        });
        insertArtists([...artists]);
        insertPlaylist(spotifty_id, 0);
        insertPlaylistTracks(data.map(t => { return { track_id: t.id, playlist_id: spotifty_id } }))
         
        insertJob({
            id: "ImportOrManualReRunIndividualPlaylistJob:" + spotifty_id,
            in_progress: 0,
            success: 1,
            job_last_ran_ms: Date.now(),
            context: "SUCCESS"
        });
        

    } catch (err) {
        insertJob({
            id: "ImportOrManualReRunIndividualPlaylistJob:" + spotifty_id,
            in_progress: 0,
            success: 0,
            job_last_ran_ms: Date.now(),
            context: err.message
        });
        
    }
}
*/
/*
export function getCronJobState() {
    return cronJobRunning;
}

export function getCheckStreamsHaveUpdatedState() {
    return lastStreamCheckJobAt;
}
    */