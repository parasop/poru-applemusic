const {AppleMusic} = require("../dist/index.js");

const appleMusic = new AppleMusic({contryCode:"us"});
const data = appleMusic.resolve({query:"tum hi aana",source:"applemusic"}).then(x => console.log(x.tracks[0]))
