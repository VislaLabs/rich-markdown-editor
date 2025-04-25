import uploadPlaceholderPlugin, { findPlaceholder, } from "../lib/uploadPlaceholder";
import { ToastType } from "../types";
import { NodeSelection } from "prosemirror-state";
let uploadId = 0;
const insertFiles = function (view, event, pos, files, options) {
    const images = files.filter(file => /image/i.test(file.type));
    if (images.length === 0)
        return;
    const { dictionary, uploadImage, onImageUploadStart, onImageUploadStop, onShowToast, } = options;
    if (!uploadImage) {
        console.warn("uploadImage callback must be defined to handle image uploads.");
        return;
    }
    event.preventDefault();
    if (onImageUploadStart)
        onImageUploadStart();
    const { schema } = view.state;
    let complete = 0;
    for (const file of images) {
        const id = `upload-${uploadId++}`;
        const { tr } = view.state;
        tr.setMeta(uploadPlaceholderPlugin, {
            add: {
                id,
                file,
                pos,
                replaceExisting: options.replaceExisting,
            },
        });
        view.dispatch(tr);
        uploadImage(file)
            .then(src => {
            const newImg = new Image();
            newImg.onload = () => {
                const result = findPlaceholder(view.state, id);
                if (result === null) {
                    return;
                }
                const [from, to] = result;
                view.dispatch(view.state.tr
                    .replaceWith(from, to || from, schema.nodes.image.create({ src }))
                    .setMeta(uploadPlaceholderPlugin, { remove: { id } }));
                if (view.state.selection.from === from) {
                    view.dispatch(view.state.tr.setSelection(new NodeSelection(view.state.doc.resolve(from))));
                }
            };
            newImg.onerror = error => {
                throw error;
            };
            newImg.src = src;
        })
            .catch(error => {
            console.error(error);
            const transaction = view.state.tr.setMeta(uploadPlaceholderPlugin, {
                remove: { id },
            });
            view.dispatch(transaction);
            if (onShowToast) {
                onShowToast(dictionary.imageUploadError, ToastType.Error);
            }
        })
            .finally(() => {
            complete++;
            if (complete === images.length && onImageUploadStop) {
                onImageUploadStop();
            }
        });
    }
};
export default insertFiles;
//# sourceMappingURL=insertFiles.js.map