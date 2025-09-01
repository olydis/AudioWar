import type { Vector2D } from "../shared/Vector2D";

export class SmartCanvas {
    private _currentDimensions: Vector2D = { x: 0, y: 0 };
    private _context: CanvasRenderingContext2D | null = null;
    private canvas: HTMLCanvasElement;

    public constructor(container: HTMLElement) {
        this.canvas = document.createElement("canvas");
        container.appendChild(this.canvas);
        this.canvas.style.margin = "0";
        this.canvas.style.padding = "0";
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0px";
        this.canvas.style.left = "0px";
    }

    public get(): HTMLCanvasElement {
        return this.canvas;
    }

    public setDimensions(dimensions: Vector2D) {
        this._currentDimensions = dimensions;
        this.canvas.width = dimensions.x;
        this.canvas.height = dimensions.y;
        // this.canvas.setAttribute("width", dimensions.x.toString());
        // this.canvas.setAttribute("height", dimensions.y.toString());
        this.canvas.style.zIndex = "0";
        this._context = null;
    }

    public get context(): CanvasRenderingContext2D {
        if (this._context == null)
            this._context = this.canvas.getContext("2d")!;
        return this._context;
    }

    public resetCamera() {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
    }
    public setCamera(worldWidth: number) {
        const context = this.context;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.translate(0, 0);
        context.scale(
            this._currentDimensions.x / worldWidth,
            this._currentDimensions.x / worldWidth);
    }
}
