/// <reference path="../decls/node.d.ts" />
/// <reference path="../decls/express.d.ts" />
/// <reference path="../decls/body-parser.d.ts" />
/// <reference path="../shared/include.ts" />

// config
var confAppIp: string = "localhost";
var confAppPort: number = 8102;

import express = require("express");
import bodyParser = require("body-parser");

console.log("");
console.log("********************");
console.log("*                  *");
console.log("*   DUMMY server   *");
console.log("*                  *");
console.log("********************");
console.log("");

// APP
var app = express();
var server = require("http").createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface Score {
    mapname: string;
    playername: string;
    score: number;
}

var allscores: Score[] = [];

app.get("/submit-score", (req, res) => {
    console.log("Received score");
    console.log(req.query);
    allscores.push({mapname: req.query.mapname,
                    playername: req.query.playername,
                    score: req.query.score});
    res.end();
});

app.get("/highscore", (req, res) => {
    var mapname = req.query.mapname;
    var mapscores: Score[] = allscores.filter((entry) => entry.score && entry.mapname == mapname);
    mapscores.sort((a,b) => {return (b.score-a.score);});
    console.log(mapscores);
});

app.use("/", express.static("build/client"));

server.listen(confAppPort);
