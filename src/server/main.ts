// config
const confAppPort: number = 8102;

import type { Score } from "../shared/Score";
import express from "express";
import { createServer } from "http";

// APP
const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var allscores: Score[] = [];

app.get("/submit-score", (req, res) => {
    console.log("Received score");
    console.log(req.query);
    allscores.push({
        mapname: req.query.mapname as string,
        playername: req.query.playername as string,
        score: +(req.query.score as string)
    });
    res.end();
});

app.get("/highscore", (req, res) => {
    var mapname = req.query.mapname;
    var mapscores: Score[] = allscores.filter((entry) => entry.score && entry.mapname == mapname);
    mapscores.sort((a, b) => { return (b.score - a.score); });

    res.write(JSON.stringify(mapscores));
    res.end();
});

app.use("/", express.static("build/client"));

server.listen(confAppPort);
