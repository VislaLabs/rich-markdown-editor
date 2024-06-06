import * as React from "react";
import { Props as BlockMenuItemProps } from "./BlockMenuItem";
declare type EmojiMenuItemProps = Omit<BlockMenuItemProps, "shortcut" | "theme"> & {
    emoji: string;
};
export default function EmojiMenuItem(props: EmojiMenuItemProps): React.JSX.Element;
export {};
//# sourceMappingURL=EmojiMenuItem.d.ts.map