/// <reference path="../shared/include.ts" />
/// <reference path="./GameMap.ts" />


var tones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "+C"];

import $ = require("jquery");

import { AudioAnalysis } from "AudioAnalysis";
import { SmartCanvas } from "SmartCanvas";

import Bubble = require("Bubble");
import GameMaps = require("GameMaps");
            
            
function playSound(id: string, once: boolean = false): void
{
    var audio = $("#" + id);
    if (audio.hasClass("done"))
        return;
    (<HTMLAudioElement>audio[0]).play();
    if (once)
        audio.addClass("done");
}
            
document.body.requestFullscreen = 
    document.body.requestFullscreen || 
    document.body.webkitRequestFullscreen || 
    (<any>document.body).mozRequestFullScreen || 
    (<any>document.body).msRequestFullscreen;

var audioAnalysis: AudioAnalysis;
var maps: GameMap[];
var selectedMap: GameMap;

function loadStartMenu() {
    $("#placeholder").html($("#start-menu").html());

    $("#lbl-heading").click(() => document.body.requestFullscreen());

    var startButtons = $("#btn-starts");
    maps.forEach((map,i) => 
    {
        startButtons.append($("<h1>").css("font-size", "2em").append(
            $("<span>")
                .addClass("game-btn")
                .attr("id", "btn-start-" + map.name)
                .text((i+1) + ". " + map.name)
                .click(() =>
                {
                    selectedMap = map;
            
                    runGame();
                })));
    });
    
    $(".game-btn").mouseenter(() => playSound("sndClick"));
}

function loadGameOverMenu() {
    $("#placeholder").html($("#gameover-menu").html());

    $("#btn-tomenu").click(() => loadStartMenu());
    $("#btn-retry").click(() => runGame());
    
    $(".game-btn").mouseenter(() => playSound("sndClick"));
}

function loadWonGameMenu(score: number) {
    $("#placeholder").fadeOut(1000, () => {
        $("#placeholder").html($("#won-menu").html());
        $("#placeholder").fadeIn("fast");

        $("#btn-tomenu").click(() => loadStartMenu());

        $("#points").text(score.toString());

        $("#btn-submit").click(() => {
            var name: string = "" + $("#player-name").val();

            if(!name) {
                $("#player-name").css("background-color", "rgba(200,0,0,0.4)");
                setInterval(() => {$("#player-name").css("background-color", "black");}, 200);
                return;
            }

            $.get("/submit-score", {mapname: selectedMap.name, playername: name, score: score},
                (result, status) => {
                    loadStartMenu();
                }
            );
        });
    });
    $(".game-btn").mouseenter(() => playSound("sndClick"));
}

// INIT
$(() =>
{
    maps = GameMaps();
    
    if (!navigator.mediaDevices) {
        throw "microphone input not supported on your browser";
    } else {
        // Quick fix. Real solution: https://github.com/Microsoft/TypeScript/issues/13947
        (navigator.mediaDevices.getUserMedia as any)({ video: false, audio: true }).then((stream: MediaStream) => {
            audioAnalysis = new AudioAnalysis(stream); loadStartMenu();
        }).catch((error) => {
            alert("Please enable microphone access");
            throw "failed to access microphone (" + error + ")";
        });
    }
});

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    alert("Error occured: " + errorMsg); //or any message
    return false;
}

// function toneFromFreq(freq: number): string
// {
//     var cFreq = 523.2511306011974 / 2;
//     freq /= cFreq;
//     var tone = Math.log(freq) / Math.log(2);
//     var oct = tone | 0;
//     tone -= oct;
//     tone = 12 * tone | 0;
//     return tones[tone];
// }

var delayMS = 20;
function runGame(): void
{
    var gameOver = () => {
        playSound("sndLost");
        clearInterval(gameInterval);
        loadGameOverMenu();
    };

    var wonGame = (score: number) => {
        clearInterval(gameInterval);
        loadWonGameMenu(score);
    };
    
    $("audio").removeClass("done");
    
    // resources
    var imgPlanet = <HTMLImageElement>document.getElementById("imgPlanet");
    var imgAsteroid1 = <HTMLImageElement>document.getElementById("imgAsteroid1");
    var imgAsteroid2 = <HTMLImageElement>document.getElementById("imgAsteroid2");
    
    var worldSize = { x: 1000, y: -1 };
    
    var wnd: JQuery = $(window);
    var body: JQuery = $("#placeholder");
    body.html("");
    //body.append("<div id='stars'></div> <div id='stars2'></div> <div id='stars3'></div>");
    body.append($("<h1>").text("Exit game")
                         .addClass("game-btn")
                         .css("color","white")
                         .css("position","fixed")
                         .attr("id","btn-tomenu")
                         .css("z-index","5")
                         .css("margin-left", "1%"));
    $("#btn-tomenu").click(() => {
        clearInterval(gameInterval);
        loadStartMenu();
    });

    var mapscores: Score[] = [];
    $.get("highscore", {mapname: selectedMap.name}, (res, status) =>
    {
        res = JSON.parse(res);
        mapscores = res;
    });
    
    var canvasSize: Vector2D = { x: 0, y: 0 };
    
    var canvas = new SmartCanvas(body);

    // game state
    var score: number = 0;

    var particles: { pos: Vector2D; vel: Vector2D; life: number }[] = [];
    var explode = (pos: Vector2D, num: number) =>
    {
        for (var i = 0; i < num; ++i)
        {
            var dir = Math.random() * Math.PI * 2;
            var speed = Math.random();
            particles.push({
                pos: { x: pos.x + Math.sin(dir) * Math.random() * num, y: pos.y + Math.cos(dir) * Math.random() * num },
                vel: { x: Math.sin(dir) * speed, y: Math.cos(dir) * speed },
                life: 300
            });
        }
    };
    
    var ammo: { pos: Vector2D; vel: Vector2D }[] = [];
    var bubbleQ: { settings: BubbleSettings; timeStamp: number }[] = JSON.parse(JSON.stringify(selectedMap.queue));
    
    var bubbles: Bubble[] = [];
    var myHealth: number = 1000;
    var myInitialHealth: number = 1000;

    var comboCounter: number = 1;
    var comboHotness: number = 0;

    var gameStart = Date.now();
    var lastGameTime: number = null;
    var gameInterval = setInterval(() =>
    {
        var gameTime = Date.now() - gameStart - 3000;
        if (!lastGameTime)
            lastGameTime = gameTime;
        var gameTimeDiff = gameTime - lastGameTime;
        lastGameTime = gameTime;
        
        // resize handling
        var width = wnd.width();
        var height = wnd.height();
        var newCanvasSize: Vector2D = { x: width, y: height };
        if (canvasSize.x != newCanvasSize.x || 
            canvasSize.y != newCanvasSize.y)
        {
            canvas.setDimensions(canvasSize = newCanvasSize);
            worldSize.y = worldSize.x * canvasSize.y / canvasSize.x;
        }
        
        var laserCenter: Vector2D = { x: worldSize.x / 2, y: 3 * worldSize.y };
        
        // audio logic
        var frequencies = audioAnalysis.getInput();
            
        // game logic
        if (myHealth <= 0) {
            gameOver();
            return;
        }
        if (bubbles.length == 0 && bubbleQ.length == 0) {
            wonGame(score);
            return;
        }

        bubbles.forEach(a => { 
            a.location.x += a.velocity.x * gameTimeDiff;
            a.location.y += a.velocity.y * gameTimeDiff;

            if (a.location.y + 80 > worldSize.y) {
                explode(a.location, a.initialLife / 50);
                myHealth = Math.max(0, myHealth - a.life / 10);
                a.life = 0;
            }
        });
        ammo.forEach(a => { 
            a.pos.x += a.vel.x * gameTimeDiff;
            a.pos.y += a.vel.y * gameTimeDiff;
        });
        ammo = ammo.filter(a => a.pos.y > -worldSize.y);
        
        particles.forEach(a => { 
            a.pos.x += a.vel.x * gameTimeDiff;
            a.pos.y += a.vel.y * gameTimeDiff;
            a.life -= gameTimeDiff;
        });
        particles = particles.filter(x => x.life > 0);
        
        if (bubbleQ.length != 0 && bubbleQ[0].timeStamp < gameTime)
            bubbles.push(new Bubble(bubbleQ.shift().settings, worldSize, laserCenter));
            
        bubbles.forEach((x, i) => 
        {
            var bRad = x.radius;
            ammo.forEach(a => 
            {
                var delta = { x: a.pos.x - x.location.x, y: a.pos.y - x.location.y };
                var distSq = delta.x*delta.x + delta.y*delta.y;
                var distMax = 30 + bRad;
                if (distSq < distMax * distMax)
                {
                    var shield = Math.min(i + 1, 2);
                    
                    a.pos.y = -worldSize.y;
                    x.hit(2*delayMS / shield);
                    
                    if (x.life <= 0)
                    {
                        explode(x.location, x.initialLife / 50);
                        if (i == 0)
                        {
                            comboCounter++;
                            comboHotness += 250;
                        }
                        else
                            comboCounter = 1;
                    }
                    
                    score += 2*delayMS * comboCounter;
                }
            });
        });
        bubbles = bubbles.filter(x => x.life > 0);
        
        // rendering
        canvas.resetCamera();
        var context = canvas.context;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        canvas.setCamera(worldSize.x);
        for (var i = 0; i < bubbles.length; ++i)
        {
            var b = bubbles[bubbles.length - i - 1];
            var radius = b.radius;
            
            context.save();
            context.translate(b.location.x, b.location.y);
            context.scale(radius / 256, radius / 256);
            context.rotate(b.seed + gameTime / 10000 * ((b.seed % 5) - 2));
            context.drawImage(b.seed % 2 == 0 ? imgAsteroid1 : imgAsteroid2, -256, -256, 512, 512);
            
            context.restore();
            
            var health = b.life / b.initialLife;
            context.fillStyle = "rgb(255, " + (255 * health | 0) + "," + (255 * health | 0) + ")";
            var barSize = radius * health;
            context.fillRect(b.location.x - barSize, b.location.y - radius - 5, barSize * 2, 3);
        }
        
        context.lineCap = "round";
        frequencies.forEach(f => {
            var laserTarget: Vector2D = { x: f * worldSize.x, y: 0 };
            
            var dir: Vector2D = { x: laserTarget.x - laserCenter.x, y: laserTarget.y - laserCenter.y };
            var len = Math.sqrt(dir.x*dir.x + dir.y*dir.y);
            dir.x /= len;
            dir.y /= len;
            dir.x += (Math.random() * 2 - 1) / 50;
            var newAmmo = { pos: { x: laserCenter.x + (Math.random() * 2 - 1) * 5, y: laserCenter.y + (Math.random() * 2 - 1) * 5 }, vel: dir };
            // get out of ground
            var t = (worldSize.y - newAmmo.pos.y) / dir.y;
            newAmmo.pos.x += dir.x * t;
            newAmmo.pos.y += dir.y * t;
            ammo.push(newAmmo);
            
            context.lineWidth = 1;
            context.strokeStyle = "red";
            context.beginPath();
            context.moveTo(laserTarget.x, laserTarget.y);
            context.lineTo(laserCenter.x, laserCenter.y);
            context.closePath();
            context.stroke();
        });

        context.globalAlpha = 0.6;
        context.globalCompositeOperation = "lighter";
        
        ammo.forEach(a => {
            context.lineWidth = 10;
            context.strokeStyle = "#882200";
            context.beginPath();
            context.moveTo(a.pos.x, a.pos.y);
            context.lineTo(a.pos.x - 30 * a.vel.x, a.pos.y - 30 * a.vel.y);
            context.stroke();
            context.closePath();
        });
        
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
        
        context.fillStyle = "grey";
        particles.forEach(a => {
            context.beginPath();
            context.arc(a.pos.x, a.pos.y, 3, 0, Math.PI * 2);
            context.closePath();
            context.fill();
        });
        
        // PLANET
        var planetRadius = worldSize.x;
        context.save();
        context.translate(worldSize.x / 2, worldSize.y + planetRadius * 0.88 * 0.7);
        context.scale(1, 0.7);
        context.rotate(gameTime / 90000);
        context.drawImage(imgPlanet, -planetRadius, -planetRadius, planetRadius * 2, planetRadius * 2);
        context.restore();

        context.save();
        context.font = "50px monospace";
        context.shadowColor = "black";
        context.fillStyle = "white";
        context.shadowBlur = 5;
        context.textAlign = "center";
        var debugNotes: string[] = [];
        frequencies.forEach(f => {
            var note = tones[Math.round(Math.min(12, Math.max(0, f * 12)))];
            debugNotes.push(note);
        });
        debugNotes = debugNotes.filter((x,i) => i == 0 || debugNotes[i-1] != x);
        context.fillText(debugNotes.length == 0 ? "" : debugNotes.join(", "), worldSize.x / 2, worldSize.y - 45);
        context.restore();

        // countdown
        if (gameTime < 0)
        {
            var sec = Math.ceil(-gameTime / 1000);
            playSound("sndCnt" + sec, true);
            var subsec = (gameTime / 1000) % 1 + 1;
            context.save();
            context.globalAlpha = 1 - subsec;
            context.font = (subsec * 50 + 100 | 0) + "px monospace";
            context.shadowColor = "white";
            context.fillStyle = "white";
            context.shadowBlur = 5;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(sec.toString(), worldSize.x / 2, worldSize.y / 2);
            context.restore();
        }

        // health
        context.fillStyle = "#008800";
        var barSize = myHealth / myInitialHealth;
        context.fillRect(worldSize.x / 4 + (worldSize.x * (1 - barSize)) / 4, worldSize.y - 20, barSize * worldSize.x / 2, 10);
    
        // score + factor
        context.textBaseline = "middle";
        
        context.fillStyle = "#ffd700";
        context.font = "25px monospace";
        context.fillText("" + score, worldSize.x - 130, 30);
        
        comboHotness = Math.min(Math.max(0, comboHotness - gameTimeDiff), 1000);
        var redness = Math.max(0, Math.min((comboCounter - 4) / 10, 1));
        context.shadowBlur = Math.min(comboHotness / 10, 7);
        context.shadowColor = context.fillStyle = "rgb(255," + (255 - 255 * redness | 0) + "," + (255 - 255 * redness | 0) + ")";
        context.font = (comboHotness / 60 + 25 | 0) + "px monospace";
        context.fillText("x" + comboCounter, worldSize.x - 130, 65);
        context.shadowBlur = 0;

        // highscore
        context.fillStyle = "white";
        context.font = "7px monospace";
        
        mapscores.push({playername: "You", mapname: "dummy-player", score: score});
        mapscores.sort((a,b) => {return b.score - a.score;});

        var scoreNum = Math.min(5, mapscores.length);
        context.fillText("Highscore:", 10, -1*9 + worldSize.y / 2 - 50);
        for (var i = 0; i < scoreNum; ++i) {
            context.fillText((i+1) + ". " + mapscores[i].score + ": " + mapscores[i].playername, 10, i*9 + worldSize.y / 2 - 50);
        }
        var inScoreboard = -1;
        for (var i = 0; i < mapscores.length; ++i)
            if (mapscores[i].mapname == "dummy-player") inScoreboard = i;

        if (inScoreboard >= scoreNum) {
            if (inScoreboard > scoreNum)
                context.fillText("...", 10, (scoreNum++)*9 + worldSize.y / 2 - 50);
            context.fillText((inScoreboard+1) + ". " + score + ": You", 10, scoreNum*9 + worldSize.y / 2 - 50);
        }

        mapscores = mapscores.filter(x => x.mapname != "dummy-player");
    
    }, delayMS);
}