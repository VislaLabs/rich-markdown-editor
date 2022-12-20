import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';

export const getEmbedState = type => state => {
  if (!type) {
    return undefined;
  }

  const node =
    findSelectedNodeOfType(type)(state.selection) ||
    findParentNode(node => node.type === type)(state.selection);

  if (!node) {
    return undefined;
  }

  return node.node.attrs.state;
};

export const getEmbedParams = type => state => {
  if (!type) {
    return undefined;
  }

  const node =
    findSelectedNodeOfType(type)(state.selection) ||
    findParentNode(node => node.type === type)(state.selection);

  if (!node) {
    return undefined;
  }

  return new URL(node.node.attrs.href).searchParams;
};

export const getEmbedClassName = type => state => {
  return getEmbedParams(type)(state)?.get('className') || '';
};

export const getEmbedType = type => state => {
  if (!type) {
    return '';
  }

  const node =
    findSelectedNodeOfType(type)(state.selection) ||
    findParentNode(node => node.type === type)(state.selection);

  if (!node) {
    return '';
  }

  const pathname = new URL(node.node.attrs.href).pathname;

  return pathname.split('/')?.[1];
};
