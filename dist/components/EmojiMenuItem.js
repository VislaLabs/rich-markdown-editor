import * as React from "react";
import BlockMenuItem from "./BlockMenuItem";
import styled from "styled-components";
const Emoji = styled.span `
  font-size: 16px;
`;
const EmojiTitle = ({ emoji, title, }) => {
    return (React.createElement("p", null,
        React.createElement(Emoji, { className: "emoji" }, emoji),
        "\u00A0\u00A0",
        title));
};
export default function EmojiMenuItem(props) {
    return (React.createElement(BlockMenuItem, Object.assign({}, props, { title: React.createElement(EmojiTitle, { emoji: props.emoji, title: props.title }) })));
}
//# sourceMappingURL=EmojiMenuItem.js.map