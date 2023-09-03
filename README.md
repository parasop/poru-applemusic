# Apple Music Plugin for poru

this plugin allow you to play song,album,playlist,artist url and search result from apple music

## How to use it?

here basic example usage
```js
const {AppleMusic} = require("poru-applemusic");
const { Client, GatewayIntentBits } = require("discord.js");
const { Poru } = require("poru");
const nodes = [
  {
    name: "local-node",
    host: "localhost",
    port: 2333,
    password: "youshallnotpass",
  },
];

const appleMusic = new AppleMusic({
countryCode:"us",
imageWidth:900,
imageHeight:600

})

const PoruOptions = {
  library:"discord.js",
  plugins:[appleMusic]
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});
client.poru = new Poru(client, nodes, PoruOptions);


//example to search query in apple music
const response = await client.poru.resolve({query:"tum hi aana",source:"applemusic",requster:"discord user object"})

//example with apple music url
const response = await client.poru.resolve({query:"apple music url here",requster:"discord user object"})

```


## example response (search result)
 
#### don't worry about empty string of track,poru will manage it


![image](https://media.discordapp.net/attachments/732987654165233744/1147214988965052496/image.png)

![image](https://media.discordapp.net/attachments/732987654165233744/1147216177773420655/image.png)

## Need Help?

Feel free to join our [discord server](https://discord.gg/Zmmc47Nrh8), Give us suggestions and advice about errors and new features.
with ❤️ by [Paras](https://github.com/parasop) .


