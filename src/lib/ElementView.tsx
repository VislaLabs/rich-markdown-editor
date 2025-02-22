import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { createPortal } from 'react-dom';
import { EditorView, Decoration } from 'prosemirror-view';
import Extension from '../lib/Extension';
import Node from '../nodes/Node';
import { light as lightTheme, dark as darkTheme } from '../styles/theme';
import Editor from '../';

type Component = (options: {
  node: Node;
  theme: typeof lightTheme;
  isSelected: boolean;
  isEditable: boolean;
  getPos: () => number;
}) => React.ReactElement;

export default class ElementView {
  component: Component;
  editor: Editor;
  extension: Extension;
  node: Node;
  view: EditorView;
  getPos: () => number;
  decorations: Decoration<{ [key: string]: any }>[];
  isSelected = false;
  dom: HTMLElement | null;
  root: ReactDOM.Root;

  // See https://prosemirror.net/docs/ref/#view.NodeView
  constructor(
    component,
    { editor, extension, node, view, getPos, decorations },
  ) {
    this.component = component;
    this.editor = editor;
    this.extension = extension;
    this.getPos = getPos;
    this.decorations = decorations;
    this.node = node;
    this.view = view;
    this.dom = node.type.spec.inline
      ? document.createElement('span')
      : document.createElement('div');
  }

  render() {
    if (!this.dom) {
      return null;
    }
    const { dark } = this.editor.props;
    const theme = this.editor.props.theme || (dark ? darkTheme : lightTheme);
    const children = this.component({
      theme,
      node: this.node,
      isSelected: this.isSelected,
      isEditable: this.view.editable,
      getPos: this.getPos,
    });
    return createPortal(children, this.dom);
  }

  update(newNode) {
    if (newNode.type !== this.node.type) {
      return false;
    }
    this.node = newNode;
    // Ask editor to schedule a re-render
    this.editor.scheduleNodeViewUpdate(this);
    return true;
  }

  selectNode() {
    if (this.view.editable) {
      this.isSelected = true;
      this.editor.scheduleNodeViewUpdate(this);
    }
  }

  deselectNode() {
    if (this.view.editable) {
      this.isSelected = false;
      this.editor.scheduleNodeViewUpdate(this);
    }
  }

  stopEvent() {
    return true;
  }

  destroy() {
    this.dom = null;
  }

  ignoreMutation() {
    return true;
  }
}
