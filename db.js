import {Pool} from "pg";

const db = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false
    }
});

const client = await db.connect();

await client.query(`
    create table if not exists tracks (
        id TEXT PRIMARY KEY,
        name TEXT,
        first_artist_name TEXT,
        last_fm_link TEXT
    );
    create table if not exists stream_snapshots (
        id TEXT,
        streams BIGINT,
        date TEXT,
        PRIMARY KEY (id, date)
    );
    create table if not exists playlists (
        id TEXT PRIMARY KEY,
        status INT
    );
    create table if not exists playlist_track (
        track_id TEXT,
        playlist_id TEXT,
        PRIMARY KEY (track_id, playlist_id)
    );
    create table if not exists users (
        discord_id BIGINT PRIMARY KEY,
        last_fm_username TEXT,
        has_admin INT
    );
    create table if not exists user_cover (
        user_id BIGINT,
        version INT,
        enabled INT,
        album_id TEXT,
        custom_cover_url TEXT,
        PRIMARY KEY (user_id, version)
    );
`);

export { client };