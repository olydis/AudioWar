export function dom(tagName: string, props: object, ...contents: any[]) {
    const result: any = document.createElement(tagName);
    for (const [key, value] of Object.entries(props || {})) {
        if (key === 'style') {
            for (const [skey, svalue] of Object.entries(value || {})) {
                result.style[skey] = svalue;
            }
            continue;
        }
        result[key] = value;
    }
    for (const content of contents) {
        for (const elem of Array.isArray(content) ? content : [content]) {
            result.append(elem);
        }
    }
    return result;
}
