# turntable-slack-bot

### ttapi requirements

Per the [ttapi docs](https://github.com/alaingilbert/Turntable-API), you can collect three of the turntable env variables using [this bookmarklet](http://alaingilbert.github.io/Turntable-API/bookmarklet.html) \_(also included in this readme at the bottom for future-proofing)

### Slack requirements

#### SLACK_BOT_TOKEN

Retrieved after setting up the bot within Slack.

- https://api.slack.com/apps

The following manifest can be used to duplicate the necessary permissions in https://app.slack.com/app-settings/<WORKSPACEID>/<BOTID>/app-manifest

```yml
display_information:
  name: Your Turntable Bot
  description: turntable.fm integration
  background_color: "#000000"
features:
  bot_user:
    display_name: Your Turntable Bot
    always_online: false
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:read
      - channels:write.topic
      - chat:write
      - incoming-webhook
      - groups:read
      - groups:history
      - groups:write.topic
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

#### SLACK_CHANNEL_ID

This can most easily be found in the URL when you navigate to the desired channel in the web interface.

### Env

These are the fields needed in .env:

- `AUTH`: this field
- `USERID`: this field
- `ROOMID`: this field
- `SLACK_BOT_TOKEN`: this field
- `SLACK_CHANNEL_ID`: this field

#### Development

```
yarn dev
```

#### Production Running

```
yarn pm2
```

#### Bookmarklet contents for collecting AUTH/USERID/ROOMID

Originally found [here](http://alaingilbert.github.io/Turntable-API/bookmarklet.html)

```
javascript:(function(){       var container = document.body;       if(document.getElementById("ttapi")) {          return container.removeChild(document.getElementById("ttapi"));       }       var obj = document.createElement("div");       obj.id = "ttapi";       obj.style.position = "absolute";       obj.style.top = "20px";       obj.style.left = "20px";       obj.style.width = "500px";       obj.style.height = "100px";       obj.style.padding = "10px";       obj.style.zIndex = 20000;       obj.style.backgroundColor = "#fff%22;%20%20%20%20%20%20%20obj.style.fontSize%20=%20%2213px%22;%20%20%20%20%20%20%20var%20auth%20=%20document.createElement(%22div%22);%20%20%20%20%20%20%20%20%20%20%20auth.innerHTML%20=%20%22var%20AUTH%20=%20'%22+turntable.user.auth+%22';%22;%20%20%20%20%20%20%20var%20userid%20=%20document.createElement(%22div%22);%20%20%20%20%20%20%20%20%20%20%20userid.innerHTML%20=%20%22var%20USERID%20=%20'%22+turntable.user.id+%22';%22;%20%20%20%20%20%20%20for%20(var%20i%20in%20turntable)%20{%20if%20(turntable[i].roomId)%20{%20var%20rid%20=%20turntable[i].roomId;%20break;%20}%20}%20%20%20%20%20%20%20var%20roomid%20=%20document.createElement(%22div%22);%20%20%20%20%20%20%20%20%20%20%20roomid.innerHTML%20=%20%22var%20ROOMID%20=%20'%22+rid+%22';%22;%20%20%20%20%20%20%20obj.appendChild(auth);%20%20%20%20%20%20%20obj.appendChild(userid);%20%20%20%20%20%20%20obj.appendChild(roomid);%20%20%20%20%20%20%20container.appendChild(obj);%20%20%20%20})();
```
