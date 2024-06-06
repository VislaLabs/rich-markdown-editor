import Extension from "../lib/Extension";
export default abstract class Mark extends Extension {
    get type(): string;
    abstract get schema(): any;
    get markdownToken(): string;
    get toMarkdown(): Record<string, any>;
    parseMarkdown(): {};
    commands({ type }: {
        type: any;
    }): () => any;
}
//# sourceMappingURL=Mark.d.ts.map