/// <reference path="../decls/jquery.d.ts" />
/// <reference path="../decls/require.d.ts" />
/// <reference path="../decls/socket.io-client.d.ts" />
/// <reference path="../shared/include.ts" />
/// <reference path="../decls/webrtc/MediaStream.d.ts" />
/// <reference path="../decls/webaudioapi/waa.d.ts" />

import $ = require("jquery");

import EnvironmentTS = require("Environment");
type Environment = EnvironmentTS.Environment;
var Environment = EnvironmentTS.Environment;

import SmartCanvasTS = require("SmartCanvas");
type SmartCanvas = SmartCanvasTS.SmartCanvas;
var SmartCanvas = SmartCanvasTS.SmartCanvas;

import Bubble = require("Bubble");
     
var tones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            
document.body.requestFullscreen = 
    document.body.requestFullscreen || 
    document.body.webkitRequestFullscreen || 
    (<any>document.body).mozRequestFullScreen || 
    (<any>document.body).msRequestFullscreen;
navigator.getUserMedia = 
    navigator.getUserMedia || 
    navigator.webkitGetUserMedia || 
    navigator.mozGetUserMedia || 
    navigator.msGetUserMedia;

// INIT
$(() => {
    if (!navigator.getUserMedia) {
        window.alert("no mix detected");
    } else {
        navigator.getUserMedia({ video: false, audio: true }, 
            stream => 
            {
                var AudioContext: AudioContextConstructor = window.AudioContext || (<any>window).webkitAudioContext;
                var audioContext = new AudioContext();
                
                var inputPoint = audioContext.createGain();

                var realAudioInput = audioContext.createMediaStreamSource(stream);
                var audioInput = realAudioInput;
                audioInput.connect(inputPoint);
            
                var analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 2048; // FFT resolution
                analyserNode.minDecibels = -90;
                analyserNode.maxDecibels = -10;
                analyserNode.smoothingTimeConstant = 0.85;
                inputPoint.connect( analyserNode );
                
                main(new Environment(analyserNode));
            }, 
            error => 
            {
                window.alert("no mix detected");
            });
    }
});

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    alert("Error occured: " + errorMsg); //or any message
    return false;
}

function toneFromFreq(freq: number): string
{
    var cFreq = 523.2511306011974 / 2;
    freq /= cFreq;
    var tone = Math.log(freq) / Math.log(2);
    var oct = tone | 0;
    tone -= oct;
    tone = 12 * tone | 0;
    return tones[tone];
}

// CALLED WHEN READY
function main(environment: Environment)
{
    var body = $("body");

    runGame(environment);
    return;

    //body.click(() => { document.body.requestFullscreen(); });
    
    //var canvas = $("<canvas>");
    //canvas.appendTo(body);
    //canvas.attr("width", );
    
    var table = $("<table>").appendTo(body);
    var cells: JQuery[] = [];
    var rowCount = environment.getInput().length;
    for (var i = 0; i < rowCount; ++i)
    {
        var cell: JQuery;
        $("<tr>")
            .appendTo(table)
            .append($("<td>").text(i.toString()))
            .append(cell = $("<td>").text("-"));
        cells.push(cell);
    }
    
    setInterval(() => 
    {
        var data = environment.getInput();
        data.forEach((x, i) => 
        { 
            /*var str = x.toString();
            while (str.length < 4)
                str = " " + str;
            str += " ";
            for (var xx = 0; xx < x; xx++)
                str += "#";
            cells[i].html(str.replace(" ", "&nbsp;"));*/
            console.log(x);
        });
        //console.log(data.map(f => toneFromFreq(f)).join(", "));
        body.text(data.map(f => toneFromFreq(f)).join(", "));
    }, 10);
}

// index to frequency: x => x * 22 + 440
var delayMS = 10;
function runGame(environment: Environment): void
{
    // resources
    var imgPlanet = document.getElementById("imgPlanet");
    
    var worldSize = { x: 1000, y: -1 };
    
    var wnd: JQuery = $(window);
    var body: JQuery = $("body");
    body.text("");
    
    var canvasSize: Vector2D = { x: 0, y: 0 };
    
    var canvas = new SmartCanvas(body);
    
    // game state
    var ammo: { pos: Vector2D, vel: Vector2D }[] = [];
    
    var bubbleQ: { settings: BubbleSettings; timeStamp: number }[] = [];
    // HELPERS
    {
        var currentTime = 0;
        var addTone = (symbol: string, duration: number = 1, progress: boolean = true) =>
        {
            duration *= 300;
            bubbleQ.push({ settings: { frequency: tones.indexOf(symbol) / 12, life: duration }, timeStamp: currentTime });
            if (progress)
                currentTime += duration;
        };
        // bubbleQ.push({ settings: { frequency: 0, life: 1000 }, timeStamp: currentTime });
        // bubbleQ.push({ settings: { frequency: 1, life: 1000 }, timeStamp: currentTime });
        
        // addTone("C");
        // addTone("E");
        // addTone("G");
        
        addTone("C");
        addTone("D");
        addTone("E");
        addTone("F");
        addTone("G", 2);
        addTone("G", 2);
        addTone("A");
        addTone("A");
        addTone("A");
        addTone("A");
        addTone("G", 4);
        addTone("A");
        addTone("A");
        addTone("A");
        addTone("A");
        addTone("G", 4);
        addTone("F");
        addTone("F");
        addTone("F");
        addTone("F");
        addTone("E", 2);
        addTone("E", 2);
        addTone("D");
        addTone("D");
        addTone("D");
        addTone("D");
        addTone("C", 4);
    }
    
    var bubbles: Bubble[] = [];
    
    var gameStart = Date.now();
    var lastGameTime: number = null;
    setInterval(() =>
    {
        var gameTime = Date.now() - gameStart;
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
        
        var laserCenter: Vector2D = { x: worldSize.x / 2, y: 2 * worldSize.y };
        
        // audio logic
        var frequencies = environment.getInput();
            
        // game logic
        bubbles.forEach(a => { 
            a.location.x += a.velocity.x * gameTimeDiff;
            a.location.y += a.velocity.y * gameTimeDiff;
        });
        ammo.forEach(a => { 
            a.pos.x += a.vel.x * gameTimeDiff;
            a.pos.y += a.vel.y * gameTimeDiff;
        });
        ammo = ammo.filter(a => a.pos.y > -worldSize.y);
        
        if (bubbleQ.length != 0 && bubbleQ[0].timeStamp < gameTime)
            bubbles.push(new Bubble(bubbleQ.shift().settings, worldSize, laserCenter));
            
        bubbles.forEach(x => 
        {
            var bRad = x.radius;
            ammo.forEach(a => 
            {
                var delta = { x: a.pos.x - x.location.x, y: a.pos.y - x.location.y };
                var distSq = delta.x*delta.x + delta.y*delta.y;
                var distMax = 30 + bRad;
                if (distSq < distMax * distMax)
                {
                    a.pos.y = -worldSize.y;
                    x.hit(2*delayMS);
                }
            });
        });
        
        bubbles = bubbles.filter(x => x.life > 0);
        
        // rendering
        canvas.resetCamera();
        var context = canvas.context;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        canvas.setCamera(worldSize.x);
        bubbles.forEach(b => {
            context.lineWidth = b.life / 100;
            context.strokeStyle = "white";
            context.beginPath();
            context.arc(b.location.x, b.location.y, b.radius, 0, Math.PI * 2);
            context.closePath();
            context.stroke();
            
            // context.fillStyle = "white";
            // context.textAlign = "center";
            // context.textBaseline = "middle";
            // context.font = (b.fre | 0) + "px serif";
            // context.fillText(tones[b.note.note], b.location.x, b.location.y);
        });
        context.lineCap = "round";
        frequencies.forEach(f => {
            var laserTarget: Vector2D = { x: f * worldSize.x, y: 0 };
            
            var dir: Vector2D = { x: laserTarget.x - laserCenter.x, y: laserTarget.y - laserCenter.y };
            var len = Math.sqrt(dir.x*dir.x + dir.y*dir.y);
            dir.x /= len;
            dir.y /= len;
            dir.x += (Math.random() * 2 - 1) / 30;
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
            context.lineWidth = 20;
            context.strokeStyle = "#882200";
            context.beginPath();
            context.moveTo(a.pos.x, a.pos.y);
            context.lineTo(a.pos.x - 50 * a.vel.x, a.pos.y - 50 * a.vel.y);
            context.stroke();
            context.closePath();
        });
        
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
    }, delayMS);
}