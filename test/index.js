const {AppleMusic} = require("../dist/index.js");

const appleMusic = new AppleMusic({contryCode:"us"});
appleMusic.searchSong("tum hi aana","test");