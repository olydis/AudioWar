/// <reference path="../shared/include.ts" />

function saturate(x: number): number
{
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
}

export class AudioAnalysis
{
	private analyserNode: AnalyserNode;
	private freqByteData: Uint8Array;
	    
    public constructor(audioStream: MediaStream)
    { 
        var AudioContext: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        var audioContext = new AudioContext();
        
        var inputPoint = audioContext.createGain();

        var realAudioInput = audioContext.createMediaStreamSource(audioStream);
        var audioInput = realAudioInput;
        audioInput.connect(inputPoint);
    
        this.analyserNode = audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048; // FFT resolution
        this.analyserNode.minDecibels = -90;
        this.analyserNode.maxDecibels = -10;
        this.analyserNode.smoothingTimeConstant = 0.85;
        inputPoint.connect(this.analyserNode);
            
        this.freqByteData = new Uint8Array(this.analyserNode.frequencyBinCount);
    }

    public getInput(): number[]
    {
        this.analyserNode.getByteFrequencyData(this.freqByteData);
        var data: number[] = [];
        for (var i = 24; i < 120; i++)
            data.push(this.freqByteData[i]);
        
        var values = data.slice().sort((a,b) => a - b);
        var topQuart = values[values.length * 3 / 4];
        
        data = data.map(x => Math.max(0, x - topQuart));
                
        var activeIndices: number[] = [];
        data.forEach((x, i) => 
        { 
            if (i != 0 && 
                i != data.length - 1 && 
                x > 70 && 
                x > data[i - 1] && 
                x > data[i + 1]) 
                    activeIndices.push(i); 
        });
        
        return activeIndices.map(x => Math.pow(saturate(x / 96 * 2.2 - 0.5), 0.8));
    }
}