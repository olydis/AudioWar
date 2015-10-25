/// <reference path="BubbleSettings.ts" />

interface GameMap 
{
    name: string;
    queue: { settings: BubbleSettings; timeStamp: number }[];
}