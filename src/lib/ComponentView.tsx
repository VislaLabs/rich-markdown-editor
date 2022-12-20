import * as React from 'react';
import ReactDOM from 'react-dom/client';
import ReactShadowRoot from 'react-shadow-root';
import { ThemeProvider } from 'styled-components';
import { EditorView, Decoration } from 'prosemirror-view';
import { default as GlobalStyle, SetTheme } from 'app/GlobalStyle';
import Extension from './Extension';
import Node from '../nodes/Node';
import { light as lightTheme, dark as darkTheme } from '../styles/theme';
import Editor from '..';

type Component = (options: {
  node: Node;
  theme: typeof lightTheme;
  isSelected: boolean;
  isEditable: boolean;
  getPos: () => number;
  query: any;
}) => React.ReactElement;

export default class ComponentView {
  component: Component;
  editor: Editor;
  extension: Extension;
  node: Node;
  view: EditorView;
  getPos: () => number;
  query: any;
  decorations: Decoration<{ [key: string]: any }>[];
  isSelected = false;
  dom: HTMLElement | null;
  root: ReactDOM.Root;

  // See https://prosemirror.net/docs/ref/#view.NodeView
  constructor(
    component,
    { editor, extension, node, view, getPos, decorations, query },
  ) {
    this.component = component;
    this.editor = editor;
    this.extension = extension;
    this.getPos = getPos;
    this.decorations = decorations;
    this.node = node;
    this.view = view;
    this.query = query;
    this.dom = node.type.spec.inline
      ? document.createElement('span')
      : document.createElement('div');
    this.root = ReactDOM.createRoot(this.dom);
    this.renderElement();
  }

  renderElement() {
    const { dark, query } = this.editor.props;
    const theme = this.editor.props.theme || (dark ? darkTheme : lightTheme);

    const children = this.component({
      theme,
      node: this.node,
      isSelected: this.isSelected,
      isEditable: this.view.editable,
      getPos: this.getPos,
      query: this.view.props.query,
    });

    this.root.render(
      // <ReactShadowRoot>
      //   <GlobalStyle />
      //   <SetTheme />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>,
      // </ReactShadowRoot>,
    );
  }

  update(node) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.renderElement();
    return true;
  }

  selectNode() {
    if (this.view.editable) {
      this.isSelected = true;
      this.renderElement();
    }
  }

  deselectNode() {
    if (this.view.editable) {
      this.isSelected = false;
      this.renderElement();
    }
  }

  stopEvent() {
    return true;
  }

  destroy() {
    if (this.dom) {
      this.root.unmount();
    }
    this.dom = null;
  }

  ignoreMutation() {
    return true;
  }
}
