import * as React from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import styled from "styled-components";
function LinkSearchResult({ title, subtitle, selected, icon, ...rest }) {
    const ref = React.useCallback(node => {
        if (selected && node) {
            scrollIntoView(node, {
                scrollMode: "if-needed",
                block: "center",
                boundary: parent => {
                    return parent.id !== "link-search-results";
                },
            });
        }
    }, [selected]);
    return (React.createElement(ListItem, Object.assign({ ref: ref, compact: !subtitle, selected: selected }, rest),
        React.createElement(IconWrapper, null, icon),
        React.createElement("div", null,
            React.createElement(Title, null, title),
            subtitle ? React.createElement(Subtitle, { selected: selected }, subtitle) : null)));
}
const IconWrapper = styled.span `
  flex-shrink: 0;
  margin-right: 4px;
  opacity: 0.8;
`;
const ListItem = styled.li `
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 2px;
  color: ${props => props.theme.toolbarItem};
  background: ${props => props.selected ? props.theme.toolbarHoverBackground : "transparent"};
  font-family: ${props => props.theme.fontFamily};
  text-decoration: none;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  line-height: ${props => (props.compact ? "inherit" : "1.2")};
  height: ${props => (props.compact ? "28px" : "auto")};
`;
const Title = styled.div `
  font-size: 14px;
  font-weight: 500;
`;
const Subtitle = styled.div `
  font-size: 13px;
  opacity: ${props => (props.selected ? 0.75 : 0.5)};
`;
export default LinkSearchResult;
//# sourceMappingURL=LinkSearchResult.js.map