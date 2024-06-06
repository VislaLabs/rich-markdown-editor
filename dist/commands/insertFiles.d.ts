import baseDictionary from "../dictionary";
declare const insertFiles: (view: any, event: Event, pos: number, files: File[], options: {
    dictionary: typeof baseDictionary;
    replaceExisting?: boolean | undefined;
    uploadImage: (file: File) => Promise<string>;
    onImageUploadStart?: (() => void) | undefined;
    onImageUploadStop?: (() => void) | undefined;
    onShowToast?: ((message: string, code: string) => void) | undefined;
}) => void;
export default insertFiles;
//# sourceMappingURL=insertFiles.d.ts.map