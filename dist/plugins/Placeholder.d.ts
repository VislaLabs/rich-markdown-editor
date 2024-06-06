import Extension from "../lib/Extension";
export default class Placeholder extends Extension {
    get name(): string;
    get defaultOptions(): {
        emptyNodeClass: string;
        placeholder: string;
    };
    get plugins(): any[];
}
//# sourceMappingURL=Placeholder.d.ts.map