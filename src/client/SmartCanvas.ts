/// <reference path="../decls/jquery.d.ts" />
/// <reference path="../shared/Vector2D.ts" />

export class SmartCanvas
{
    private _currentDimensions: Vector2D = { x: 0, y: 0 };
    private _context: CanvasRenderingContext2D = null;
    public canvas: JQuery;
    private canvasNative: HTMLCanvasElement;
    
    public constructor(container: JQuery)
    {
        this.canvasNative = document.createElement("canvas");
        this.canvas = $(this.canvasNative).appendTo(container);
        this.canvas.css("margin", "0");
        this.canvas.css("padding", "0");
        this.canvas.css("position", "fixed");
        this.canvas.css("top", "0px");
        this.canvas.css("left", "0px");
    }
    
    public asJQuery(): JQuery
    {
        return this.canvas;
    }
    
    public setDimensions(dimensions: Vector2D)
    {
        this._currentDimensions = dimensions;
        this.canvas.width(dimensions.x);
        this.canvas.height(dimensions.y);
        this.canvas.attr("width", dimensions.x);
        this.canvas.attr("height", dimensions.y);
        this.canvas.css("z-index","0");
        this._context = null;
    }
    
    public get context(): CanvasRenderingContext2D
    {
        if (this._context == null)
            this._context = <CanvasRenderingContext2D> this.canvasNative.getContext("2d");
        return this._context;
    }
    
    public resetCamera()
    {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
    }
    public setCamera(worldWidth: number)
    {
        var context = this.context;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.translate(0, 0);
        context.scale(
            this._currentDimensions.x / worldWidth, 
            this._currentDimensions.x / worldWidth);
    }
}
