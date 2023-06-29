import "./fetch-polyfill";
import * as dotenv from "dotenv";
import { SlackAPIClient } from "slack-web-api-client";
import Bot from "ttapi";

dotenv.config();

const { AUTH, USERID, ROOMID, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } = process.env;

const slackClient = new SlackAPIClient(SLACK_BOT_TOKEN);

const bot: any = new Bot(AUTH, USERID, ROOMID);

const commands = {
  "/hello": {
    command: "/hello",
    description: "Say hello to the bot",
    execute: (data: any) => {
      bot.speak(`Hey! How are you @${data.name}?`);
    },
  },
  "/help": {
    command: "/help",
    description: "Print out this help dialog",
    execute: (data: any) => {
      bot.speak(`Hey @${
        data.name
      }! I'm the Turntable Slack Bot. I do some things automatically:

    - I'll automatically like any song that plays so folks can raise their points
    - I'll interface with Slack to update the channel with the current DJs and current songs
    - I'll respond to a few specific commands:
    
      ${Object.keys(commands)
        .map(
          (commandName: any) =>
            `${commands[commandName].command} - ${commands[commandName].description}`
        )
        .join("\n")}`);
    },
  },
} as any; // TODO: fix thiss

const postCurrentMessage = (
  metadata: any,
  openDJslots: any,
  djs: any,
  thread_ts: any
) => {
  let currentDJ = null;
  if (djs.length > 0) {
    currentDJ = djs.find((dj: any) => dj.userid === metadata.current_dj);
  }
  console.log(metadata.current_song);
  slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: !!metadata?.current_song
            ? `*${metadata.current_song.metadata.song}*\nby *${
                metadata.current_song.metadata.artist
              }*\n\n <https://turntable.com/${ROOMID}|Listen in Turntable>\n<https://open.spotify.com/search/${
                //url encode the song and artist
                encodeURIComponent(metadata.current_song.metadata.song) +
                "%20" +
                encodeURIComponent(metadata.current_song.metadata.artist)
              }|Listen on Spotify>`
            : `No song playing\n\n <https://turntable.com/${ROOMID}|DJ your own songs in Turntable>`,
        },
        accessory: {
          type: "image",
          image_url: !!metadata?.current_song
            ? metadata.current_song.metadata.coverart
            : "https://i.imgur.com/zOFtasn.png",
          alt_text: !!metadata.current_song
            ? `${metadata.current_song.metadata.song} by ${metadata.current_song.metadata.artist}`
            : "No song playing",
        },
      },
      ...(!!djs.length
        ? ([
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Current DJ: `,
                },
                {
                  type: "image",
                  image_url: `https://turntable.fm${currentDJ.images.fullfront}`,
                  alt_text: currentDJ.name,
                },
                {
                  type: "mrkdwn",
                  text: currentDJ.name,
                },
              ],
            },
          ] as any)
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `DJ Lineup: `,
          },
          ...(!!djs.length
            ? djs.map((dj: any) => ({
                type: "image",
                image_url: `https://turntable.fm${dj.images.fullfront}`,
                alt_text: dj.name,
              }))
            : []),
          ...Array.from({ length: openDJslots }).map(() => ({
            type: "image",
            image_url: "https://i.imgur.com/yNU98Cn.png",
            alt_text: "empty",
          })),
        ],
      },
    ],

    text: !!metadata?.current_song
      ? `Currently playing: ${metadata.current_song.metadata.song} by ${
          metadata.current_song.metadata.artist
        }. There are ${openDJslots} open DJ slots. Current DJ${
          djs.length === 1 ? "" : "s"
        }: ${djs.map((dj: any) => dj.name).join(", ")}`
      : "No song playing",
    thread_ts,
  });
};

const findAndPostCurrentSong = (
  metadata: any,
  openDJslots: any,
  djs: any,
  cursor?: any
) => {
  slackClient.conversations
    .list({
      types: "public_channel,private_channel",
      cursor: cursor ? cursor : undefined,
    })
    .then((response: any) => {
      console.log("conversations", response);
      const { channels } = response;
      const channel = channels.find(
        (channel: any) => channel.id === SLACK_CHANNEL_ID
      );
      console.log("channel", channel, SLACK_CHANNEL_ID);
      if (channel) {
        slackClient.conversations
          .history({
            channel: SLACK_CHANNEL_ID,
            limit: 50,
          })
          .then((response: any) => {
            // find any message posted today that has Turntable.fm song thread in it
            const { messages } = response;
            const today = new Date();
            const todayString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
            const todayStringRegex = new RegExp(todayString);
            const todaysMessage = messages.find(
              (message: any) =>
                message.text.match(/Current Song Thread for/) &&
                message.text.match(todayStringRegex)
            );
            if (todaysMessage) {
              // reply to the message with the current DJs and songs
              postCurrentMessage(metadata, openDJslots, djs, todaysMessage.ts);
            } else {
              slackClient.chat
                .postMessage({
                  channel: SLACK_CHANNEL_ID,
                  text: `<https://turntable.fm/${ROOMID}|Shared Music Room> Current Song Thread for ${todayString} :thread:`,
                })
                .then((response: any) => {
                  // link this thread in the topic
                  console.log("response", response);
                  slackClient.conversations.setTopic({
                    channel: SLACK_CHANNEL_ID,
                    topic: `<https://turntable.fm/${ROOMID}|Shared Music Room> | ${
                      ""
                      // lin to this thread
                      // e.g. https://app.slack.com/client/T05DP0D7PUL/C05DLH4N49G/thread/C05DLH4N49G-1687797420.716249
                    } <https://app.slack.com/client/${
                      response.message.team
                    }/${SLACK_CHANNEL_ID}/thread/${
                      response.ts
                    }|Current Song Thread>`,
                  });

                  // post current playing in this Thread
                  postCurrentMessage(metadata, openDJslots, djs, response.ts);
                });
            }
          });
      } else if (response.response_metadata.next_cursor) {
        findAndPostCurrentSong(
          metadata,
          openDJslots,
          djs,
          response.response_metadata.next_cursor
        );
      }
    });
};

const collectRoomInfoAndUpdateSlack = () => {
  bot.roomInfo(true, function (data: any) {
    const {
      room: { metadata },
    } = data;
    console.log("roomInfo", data);
    const { djids } = data;
    let djs = [];
    if (djids && djids.length) {
      djs = djids.map((djId: any) =>
        data.users.find((user: any) => user.userid === djId)
      );
      console.log("djs", djs.map((dj: any) => dj.name).join(", "));
    }
    const openDJslots = metadata.max_djs - metadata.djcount;
    // find out if there's a message thread for today's current playing songs
    // if there is, reply to it with the current DJs and songs
    // if there isn't, create one
    findAndPostCurrentSong(metadata, openDJslots, djs);
  });
};

bot.on("ready", function (data: any) {
  bot.roomRegister(ROOMID, function () {
    bot.setAsBot();
    collectRoomInfoAndUpdateSlack();
  });

  bot.on("speak", function (data: any) {
    // respond to any command in the commands object
    if (data.text.match(/^\/[a-z]+$/)) {
      const command = data.text.split(" ")[0] as string;
      if (commands[command]) {
        commands[command].execute(data);
      }
    }
  });
  bot.on("newsong", function (data: any) {
    console.log("newsong", data);
    bot.bop();
    collectRoomInfoAndUpdateSlack();
  });
  bot.on("nosong", function (data: any) {
    console.log("nosong", data);
  });
  bot.on("add_dj", function (data: any) {
    console.log("add_dj", data);
    collectRoomInfoAndUpdateSlack();
  });
  bot.on("rem_dj", function (data: any) {
    console.log("rem_dj", data);
    collectRoomInfoAndUpdateSlack();
  });

  console.log("running");
});
