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

function runGame(environment: Environment): void
{
    var worldSize = { x: 1000, y: -1 };
    
    var wnd: JQuery = $(window);
    var body: JQuery = $("body");
    body.text("");
    
    var canvasSize: Vector2D = { x: 0, y: 0 };
    
    var canvas = new SmartCanvas(body);
    
    // game state
    var bubbleQ: { note: MusicalNote; timeStamp: number }[] = [];
    // HELPERS
    {
        var currentTime = 0;
        var addTone = (symbol: string, duration: number = 1, progress: boolean = true) =>
        {
            duration *= 500;
            bubbleQ.push({ note: { note: tones.indexOf(symbol), octave: 0, duration: duration / 2 }, timeStamp: currentTime });
            if (progress)
                currentTime += duration;
        };
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
    
    var delayMS = 10;
    var gameStart = Date.now();
    setInterval(() =>
    {
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
        
        // audio logic
        var frequencies = environment.getInput();
        var isActive = (bubble: Bubble) =>
        {
            var freq = 523.2511306011974 / 2 * Math.pow(Math.pow(2, 1/12), bubble.note.note); // 220..440
            var relTolerance = 1.06;
            for (var i = 0; i < 4; i++, freq *= 2)
                if (frequencies.some(f => freq / relTolerance <= f && f <= freq * relTolerance))
                    return true;
            return false;
        };
            
        // game logic
        var gameTime = Date.now() - gameStart;
        if (bubbleQ.length != 0 && bubbleQ[0].timeStamp < gameTime)
            bubbles.push(new Bubble(bubbleQ.shift().note, worldSize));
        bubbles.forEach((x, i) => 
        {
            x.move(1);
            if (i == 0 && isActive(x))
                x.hit(delayMS);
        });
        bubbles = bubbles.filter(x => x.life > 0);
        
        // rendering
        var context = canvas.context;
        canvas.resetCamera();
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        canvas.setCamera(worldSize.x);
        bubbles.forEach(b => {
            context.lineWidth = b.life / 100;
            context.strokeStyle = "white";
            context.beginPath();
            context.arc(b.location.x, b.location.y, b.radius, 0, Math.PI * 2);
            context.closePath();
            context.stroke();
            
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = (b.radius | 0) + "px serif";
            context.fillText(tones[b.note.note], b.location.x, b.location.y);
        });
    }, delayMS);
}