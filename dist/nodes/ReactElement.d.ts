/// <reference types="react" />
import Node from './Node';
export default abstract class ReactElement extends Node {
    abstract element({ node, isSelected, isEditable, innerRef, }: {
        node: any;
        isSelected: any;
        isEditable: any;
        innerRef: any;
    }): React.ReactElement;
}
//# sourceMappingURL=ReactElement.d.ts.map