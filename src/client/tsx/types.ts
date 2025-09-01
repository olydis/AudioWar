type P<T extends HTMLElement> = Omit<Partial<T>, "style"> & { style?: Partial<CSSStyleDeclaration> };

declare namespace JSX {
    type Element = HTMLElement;

    interface IntrinsicElements {
        a: P<HTMLAnchorElement>;
        button: P<HTMLButtonElement>;
        canvas: P<HTMLCanvasElement>;
        img: P<HTMLImageElement>;
        input: P<HTMLInputElement>;
        [tagName: string]: P<HTMLElement>;
    }
}