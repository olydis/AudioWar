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

const allscores: Score[] = [];

app.post("/submit-score", (req, res) => {
    console.log("Received score");
    console.log(req.body);
    allscores.push({
        mapname: req.body.mapname as string,
        playername: req.body.playername as string,
        score: req.body.score as number
    });
    res.end();
});

app.get("/highscore", (req, res) => {
    const mapname = req.query.mapname;
    const mapscores: Score[] = allscores.filter((entry) => entry.score && entry.mapname == mapname);
    mapscores.sort((a, b) => { return (b.score - a.score); });

    res.write(JSON.stringify(mapscores));
    res.end();
});

app.use("/", express.static("build/client"));

server.listen(confAppPort);
