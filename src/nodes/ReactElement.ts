import Node from './Node';

export default abstract class ReactElement extends Node {
  abstract element({
    node,
    isSelected,
    isEditable,
    innerRef,
  }): React.ReactElement;
}
