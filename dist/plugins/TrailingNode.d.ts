import Extension from "../lib/Extension";
export default class TrailingNode extends Extension {
    get name(): string;
    get defaultOptions(): {
        node: string;
        notAfter: string[];
    };
    get plugins(): any[];
}
//# sourceMappingURL=TrailingNode.d.ts.map