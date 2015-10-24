/// <reference path="../shared/include.ts" />
/// <reference path="BubbleSettings.ts" />

class Bubble
{
    // dynamic
    public location: Vector2D;
    public velocity: Vector2D;
    public life: number;
    public seed: number;
    
    public get radius(): number
    {
        return 10 + this.life / 20;
    }
    
    public constructor(
        public settings: BubbleSettings,
        worldSize: Vector2D,
        target: Vector2D)
    {
        this.seed = (Math.random() * 1000) | 0;
        
        this.life = settings.life;
        
        this.location = {
            x: settings.frequency * worldSize.x,
            y: 0
        };
        var dir: Vector2D = { x: target.x - this.location.x, y: target.y - this.location.y };
        var len = Math.sqrt(dir.x*dir.x + dir.y*dir.y);
        dir.x /= len * 10;
        dir.y /= len * 10;
        this.velocity = dir;
    }
    
    public move(elapsedMS: number): void
    {
        this.location.x += this.velocity.x * elapsedMS;
        this.location.y += this.velocity.y * elapsedMS;
    }
    
    public hit(damage: number): void
    {
        this.life -= damage;
    }
}

export = Bubble;