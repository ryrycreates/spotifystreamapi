async function lastfmAPI(fields) {
    return await fetch(
        `https://ws.audioscrobbler.com/2.0?api_key=${process.env.LAST_FM_TOKEN}&format=json${fields.map(f => `&${f.field}=${f.value}`).join("")}`
    ).then(r => r.json());
}

async function np(lastfm_username) {
    try {
        const data = await lastfmAPI([
            {
                field: "method",
                value: "user.getrecenttracks"
            },
            {
                field: "user",
                value: lastfm_username
            }
        ]);

        const firstTrack = data.recenttracks.track[0];
        const nowPlaying = firstTrack["@attr"]?.nowplaying ? true : false;
        const timestampPlayed = nowPlaying ? null : firstTrack.date.uts;

        const userplaycountdata = await lastfmAPI([
            {
                field: "method",
                value: "track.getInfo"
            },
            {
                field: "user",
                value: lastfm_username
            },
            {
                field: "artist",
                value: firstTrack.artist["#text"]
            },
            {
                field: "track",
                value: firstTrack.name
            }
        ]);

        return {
            defaultCover: firstTrack.image[firstTrack.image.length - 1]["#text"],
            artistName: firstTrack.artist["#text"],
            artistId: firstTrack.artist.mid === "" ? null : firstTrack.artist.mid,
            albumName: firstTrack.album["#text"],
            albumId: firstTrack.album.mid === "" ? null : firstTrack.album.mid,
            trackName: firstTrack.name,
            trackId: firstTrack.mid === "" ? null : firstTrack.mid,
            trackUrl: firstTrack.url,
            nowPlaying,
            timestampPlayed,
            totalUserScrobbles: data.recenttracks?.["@attr"]?.total,
            userPlayCount: userplaycountdata.track.userplaycount,
            totalPlayCount: userplaycountdata.track.playcount
        }
    } catch (err) {
        console.log(err)
        return {};
    }

}

export {
    np
}