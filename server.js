import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import pkg from 'discord.js';
import { np } from './last.js';
import { GET_USER, GET_USER_COVER, getPlaylist, getTrack, INSERT_PLAYLIST, INSERT_USER, INSERT_USER_COVER } from './query.js';
import { cronJob } from "./jobs.js";
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = pkg;

const client = new Client({
    intents: [
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.Guilds,           // Basic server info
        GatewayIntentBits.GuildMessages,    // Ability to see messages
        GatewayIntentBits.MessageContent,   // Ability to READ the text inside messages
    ]
});

const PREFIX = '.';

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    if (message.content.startsWith(".au")) {
        let mentions = Array.from(message.mentions.users);
        let alt_user = mentions?.[0] || null;

        let fm = message.content.split("fm:");
        let extract = fm?.[1]?.split(" ");
        let last_fm_new_user = extract?.[0];
        if (!last_fm_new_user) return message.reply("No lastfm username provided.");
        await INSERT_USER([alt_user ? alt_user.id : message.author.id, last_fm_new_user, 0]);
        return message.reply("Added to database under last.fm username: " + last_fm_new_user);
    }

    if (message.content.startsWith(".chc")) {

        try {
            if (message.attachments.size == 0) return message.channel.send(`No image provided.`);

            const user = await GET_USER(message.author.id);
            if (!user || user.length == 0) return message.reply("Could not find user");
            const lastPlayed = await np(user.last_fm_username);
            let albumIdentifier = lastPlayed.albumId ? lastPlayed.albumId : lastPlayed.albumName + lastPlayed.artistName;

            let fm = message.content.split("v:");
            let extract = fm?.[1]?.split(" ");
            let new_v = parseInt(extract?.[0]);

            if (!new_v || isNaN(new_v)) new_v = 1;

            let mentions = Array.from(message.mentions.users);
            mentions.push({
                id: message.author.id
            });

            if ((mentions.length > 0)) {
                const attachment = message.attachments.first();
                const imageUrl = attachment.url;
                for (let i = 0; i < mentions.length; i++) {
                    let current_user = mentions[i];
                    await INSERT_USER_COVER([current_user.id, new_v, 1, albumIdentifier, imageUrl])
                    return message.reply(`Added!`);
                }
            }
        } catch (err) {
            return message.reply(err.message)
        }

    }

    if (message.content.startsWith(".npp")) {

        try {
            let user = await GET_USER(message.author.id);
            if (!user || user.length == 0) return message.reply("Could not find user");
            const lastPlayed = await np(user.last_fm_username);
            let albumIdentifier = lastPlayed.albumId ? lastPlayed.albumId : lastPlayed.albumName + lastPlayed.artistName;

            let fm = message.content.split("v:");
            let extract = fm?.[1]?.split(" ");
            let new_v = parseInt(extract?.[0]);

            if (!new_v || isNaN(new_v)) new_v = 1;

            let mentions = Array.from(message.mentions.users);
            if (mentions.length > 0) user = { discord_id: mentions[0].id };

            let getAlbumOverride = await GET_USER_COVER([user.discord_id, new_v, albumIdentifier, lastPlayed.albumName + lastPlayed.artistName]);
            let imageOverride = (!getAlbumOverride || getAlbumOverride?.length == 0) ? lastPlayed.defaultCover : getAlbumOverride.custom_cover_url;

            let streamData = await getTrack([lastPlayed.trackId || "", "", lastPlayed.trackName?.toLocaleLowerCase() + lastPlayed.artistName?.toLocaleLowerCase()]);
            let fullData = null;
            if (streamData.length > 0) {
                fullData = streamData[0];
            }
            //const trackPlays = await tempFetchTrackPlays(lastfm_username, lastPlayed.name, lastPlayed.artist["#text"]);
            await message.channel.send({
                embeds: [
                    buildEmbed({
                        ...lastPlayed,
                        dUsername: null,
                        imageOverride: imageOverride,
                        note: null,
                        lastfm_username: user.last_fm_username,
                        dataForStreams: fullData
                    }),
                ],
                components: []
            });

            //return response;
        } catch (err) {
            return message.reply(err.message)
        }
    }

    if (message.content.startsWith(".app")) {
        try {
            let fm = message.content.split("playlist:");
            let extract = fm?.[1]?.split(" ");
            let new_v = extract?.[0];

            await INSERT_PLAYLIST([new_v, 0]);
            return message.reply("Added playlist. Stats will be available for it tommorow (or whenever ryry runs the fetch)");

        } catch (err) {
            return message.reply(err.message);
        }
    }

});

function buildEmbed(data) {
    const imageUrl = data.imageOverride;

    // Formats the track statistics line at the bottom
    const statsLine = `**${parseInt(data.totalUserScrobbles).toLocaleString() || 0}** total scrobbles\n**${parseInt(data.userPlayCount).toLocaleString() || 0}** track scrobbles`;
    //let getStreamData;

    return new EmbedBuilder()
        .setColor("#000000") // Brat green hex (or stick to 0x2B2D31 if you want it fixed dark gray)
        .setDescription(
            `Now playing for **[${data.lastfm_username}](https://last.fm/user/${data.lastfm_username})**\n` +
            `### [${data.trackName}](${data.trackUrl})\n` +
            `**[${data.artistName}](https://last.fm/music/${encodeURIComponent(data.artistName)})** · *[${data.albumName}](https://last.fm/music/${encodeURIComponent(data.artistName)}/${encodeURIComponent(data.albumName)})*\n\n` +
            `${statsLine} \n`
            + `**${formatStreams(data.dataForStreams?.streams)}** total streams \n **${formatStreams(data.dataForStreams?.daily)}** daily streams`
        )
        .setThumbnail(imageUrl);
}

function formatStreams(data) {
    if(data) return data.toLocaleString();
    return "-";
}

/*
function buildTopAlbumsEmbed(albumsArray, dUsername) {
  // 1. Loop through the array and format each album line
  const listContent = albumsArray
    .map((album, index) => {
      const rank = index + 1;
      const albumName = album.name || "Unknown Album";
      const artistName = album.artist?.["#text"] || "Unknown Artist";
      const playcount = album.playcount || 0;
      const albumUrl = album.url || "#";

      return `${rank}. **[${albumName}](${albumUrl})** — ${artistName}\n` +
        ` ** · ${playcount} scrobbles**`;
    })
    .join('\n'); // Adds a double space between each album item

  // 2. Wrap it neatly inside the Discord embed layout
  return new EmbedBuilder()
    .setColor(0x2B2D31) // Sleek dark grey
    .setDescription(
      `## Top Albums for **${dUsername}**\n\n` +
      `${listContent}`
    );
}
    */

client.login(process.env.DISCORD_TOKEN);

app.post("/api/v1/start", (req, res) => {
    const { auth, client } = req.body;
    process.env.AUTH = auth;
    process.env.CLIENT = client;
    cronJob();
    res.json({
        message: "Started cron job"
    });
});

app.get("/api/v1/playlist/:id", (req, res) => {
    const { id } = req.params;
    return res.json({
        data: getPlaylist(id)
    })
});

app.get("/api/v1/track/:id", (req, res) => {
    const { id } = req.params;
    return res.json({
        data: getTrack(id, id, "")
    })
});

app.get("/api/v1/start", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Start Cron Job</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 400px;
                    margin: 50px auto;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                }
                button {
                    background-color: #007bff;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <h2>Start Cron Job</h2>
            <form action="/api/v1/start" method="POST" id="startForm">
                <div class="form-group">
                    <label for="auth">Auth Key / Token:</label>
                    <input type="text" id="auth" name="auth" required>
                </div>
                <div class="form-group">
                    <label for="client">Client ID / Token:</label>
                    <input type="text" id="client" name="client" required>
                </div>
                <button type="submit">Start Job</button>
            </form>

            <script>
                // Intercept submit to send JSON to match req.body expectations
                document.getElementById('startForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const auth = document.getElementById('auth').value;
                    const client = document.getElementById('client').value;

                    const response = await fetch('/api/v1/start', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ auth, client })
                    });

                    const result = await response.json();
                    alert(result.message || 'Submitted!');
                });
            </script>
        </body>
        </html>
    `);
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});