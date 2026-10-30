import { client } from "./db.js";

/*
export const CACHE_ALBUMS = async () => {
    return await client.query(`SELECT id, album_id, last_fm_link FROM albums`);
}

export const CACHE_TRACKS = async () => {
    return await client.query(`SELECT id, track_id, last_fm_link FROM tracks`);
}

export const CACHE_ALBUM_COVERS = async () => {
    return await client.query(`SELECT user_id, enabled, album_id, custom_cover_url FROM user_cover WHERE version = 1 AND enabled = 1`);
}
*/

export const INSERT_USER = async (vals) => {
    await client.query(`INSERT INTO users (discord_id, last_fm_username, has_admin) VALUES($1, $2, $3) ON CONFLICT (discord_id) DO UPDATE SET has_admin = excluded.has_admin`, vals);
}

export const INSERT_TRACK = async (vals) => {
    await client.query(`
        INSERT INTO tracks (id, track_id, name, first_artist_name, last_fm_link)
        VALUES($1, $2, $3, $4, $5)
        ON CONFLICT (id)
        DO UPDATE
        SET last_fm_link = excluded.last_fm_link, track_id = excluded.track_id`, vals);
}

/*
export const INSERT_ALBUM = async (vals) => {
    await client.query(`
        INSERT INTO albums (id, album_id, name, first_artist_name, last_fm_link, default_cover) 
        VALUES($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id)
        DO UPDATE
        SET last_fm_link = excluded.last_fm_link, album_id = excluded.album_id
        `, vals);
}
        */

/*
export const INSERT_DATE = async (vals) => {
    await client.query(`INSERT INTO dates (id, date) VALUES($1, $2) ON CONFLICT (id) DO NOTHING`, vals);
}


export const GET_MOST_RECENT_DATE = async () => {
    return await client.query(`SELECT id FROM dates ORDER by date DESC LIMIT 1`);
}
*/

export const TRANSACTION_QUERY = async (queries) => {
    try {
        await client.query('BEGIN');

        // Run each query and its values within the transaction
        for (const { text, values } of queries) {
            if (text && values.length > 0) {
                await client.query(text, values);
            }
        }

        await client.query('COMMIT');

    } catch (err) {
        console.log("error while inserting")
    }
}

export const INSERT_PLAYLIST = async (vals) => {
    await client.query(`INSERT INTO playlists (id, private) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET private = excluded.private`, vals);
}

export const INSERT_PLAYLIST_TRACK = async (vals) => {
    await client.query(`INSERT INTO playlist_track (track_id, playlist_id) VALUES($1, $2)`, vals);
}

export const INSERT_USER_COVER = async (vals) => {
    await client.query(`INSERT INTO user_cover (user_id, version, enabled, album_id, custom_cover_url) VALUES($1, $2, $3, $4, $5) ON CONFLICT (user_id, version) DO UPDATE SET custom_cover_url = excluded.custom_cover_url`, vals);
}

export const GET_PLAYLISTS = async () => {
    const { rows } = await client.query(`SELECT id FROM playlists`);
    return rows;
}

export const getPlaylist = async (val) => {
    return await client.query(`
    WITH target_tracks AS (
        SELECT
        tpp.track_id as id,
        t.track_id as spotify_id,
        t.last_fm_link as last_fm_id
        FROM playlist_track tpp
        JOIN tracks t ON tpp.track_id = t.id
        WHERE tpp.playlist_id = $1
    ),
    target_datapoints AS (
        SELECT
            tt.id,
            ss.date,
            ss.streams,
            ss.streams - LAG(ss.streams, 1) OVER(PARTITION BY ss.id ORDER BY ss.date ASC) as daily,
            ROW_NUMBER() OVER(PARTITION BY tt.id ORDER BY date DESC) as rn
        FROM target_tracks tt
        JOIN stream_snapshots ss on ss.id = tt.id
    ),
    stream_prime as (
    SELECT
        td.rn,
        td.id,
        td.date,
        td.streams,
        td.daily,
        td.daily - LAG(td.daily, 1) OVER(PARTITION BY td.id ORDER BY td.date ASC) as daily_derivative,
        (SELECT COUNT(*) FROM playlist_track tp JOIN playlists p on p.id = tp.playlist_id WHERE tp.track_id = td.id AND p.status = 0) as featured_in_count
        FROM target_datapoints td
    ),
    stream_double_prime as (
        SELECT *,
        td.daily_derivative - LAG(td.daily_derivative, 1) OVER(PARTITION BY td.id ORDER BY td.date ASC) as daily_derivative_II
        FROM stream_prime td WHERE td.rn = 1 OR td.rn = 2
    )
    SELECT * 
    from stream_double_prime where rn = 1;`, [val]);
}

export const getTrack = async (vals) => {
    const { rows } = await client.query(`
        SELECT
            ss.date,
            ss.streams,
            ss.streams - LAG(ss.streams, 1) OVER(PARTITION BY ss.id ORDER BY ss.date ASC) as daily
        FROM stream_snapshots ss
        JOIN tracks t
        WHERE t.last_fm_link = $1 
           OR ss.id = $2 
           OR CONCAT(LOWER(t.name), ' ', LOWER(t.first_artist_name)) = $3
        ORDER BY ss.date DESC`, vals);
    return rows;
}

export const GET_USER_COVER = async (vals) => {
    const { rows } = await client.query(`
        SELECT
        *
        FROM user_cover
        WHERE user_id = $1 AND version = $2 AND (album_id = $3 OR album_id = $4)
    `, vals);
    return rows[0];
}

export const GET_USER = async (vals) => {
    const { rows } = await client.query(`
        SELECT * FROM users WHERE discord_id = $1
    `, [vals]);
    return rows[0];
}