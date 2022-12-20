import Node from './Node';

export default class Text extends Node {
  constructor(...args: any[]) {
    super(...args);
  }

  get name() {
    return 'text';
  }

  get schema() {
    return {
      group: 'inline',
    };
  }

  toMarkdown(state, node) {
    state.text(node.text);
  }
}
