const {AppleMusic} = require("../dist/index.js");

const appleMusic = new AppleMusic({countryCode:"us"});
const data = appleMusic.resolve({query:"tum hi aana",source:"applemusic"}).then(x => console.log(x.tracks[0]))
