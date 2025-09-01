interface GameMap {
    name: string;
    queue: { settings: BubbleSettings; timeStamp: number }[];
}