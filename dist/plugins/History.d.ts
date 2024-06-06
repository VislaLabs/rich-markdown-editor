import Extension from "../lib/Extension";
export default class History extends Extension {
    get name(): string;
    keys(): {
        "Mod-z": any;
        "Mod-y": any;
        "Shift-Mod-z": any;
        Backspace: any;
    };
    get plugins(): any[];
}
//# sourceMappingURL=History.d.ts.map