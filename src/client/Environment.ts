/// <reference path="../shared/include.ts" />

export class Environment
{
	private freqByteData: Uint8Array;
	
    public playSound(id: string): void
    {
        var audio = <HTMLAudioElement>$("#" + id)[0];
        audio.play();
    }
    
    public constructor(private analyserNode: AnalyserNode)
    { 
        this.freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
    }

    public getInput(): number[]
    {
        this.analyserNode.getByteFrequencyData(this.freqByteData);
        var data: number[] = [];
        for (var i = 20; i < 120; i++)
            data.push(this.freqByteData[i]);
        
        var values = data.slice().sort((a,b) => a - b);
        var topQuart = values[values.length * 3 / 4];
        
        data = data.map(x => Math.max(0, x - topQuart));
                
        var activeIndices: number[] = [];
        data.forEach((x, i) => 
        { 
            if (i != 0 && 
                i != data.length - 1 && 
                x > 90 && 
                x > data[i - 1] && 
                x > data[i + 1]) 
                    activeIndices.push(i); 
        });
        
        return activeIndices.map(x => x * 22 + 440);
    }
}