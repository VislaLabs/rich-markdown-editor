import * as React from 'react';
import {
  TrashIcon,
  DownloadIcon,
  ReplaceIcon,
  AlignFullWidthIcon,
  AlignImageRightIcon,
  AlignImageCenterIcon,
  CheckboxIcon,
  ShuffleIcon,
} from 'outline-icons';
import {
  getEmbedClassName,
  getEmbedParams,
  getEmbedState,
  getEmbedType,
} from '../queries/getEmbedInfo';
import { MenuItem } from '../types';
import baseDictionary from '../dictionary';
import { EditorState } from 'prosemirror-state';

export default function imageMenuItems(
  state: EditorState,
  dictionary: typeof baseDictionary,
): MenuItem[] {
  const { schema } = state;
  const isCollection = getEmbedType(schema.nodes.embed)(state) === 'collection';

  return [
    {
      name: 'wide',
      tooltip: 'Align full width',
      icon: AlignFullWidthIcon,
      visible: true,
      active: state =>
        getEmbedClassName(schema.nodes.embed)(state).includes('wide'),
    },
    {
      name: 'box',
      tooltip: 'Border',
      icon: CheckboxIcon,
      visible: true,
      active: () =>
        !getEmbedClassName(schema.nodes.embed)(state).includes('inline'),
    },
    {
      name: 'setActiveState',
      tooltip: 'Set active state',
      icon: () => <span>:act</span>,
      visible: true,
      active: () => getEmbedState(schema.nodes.embed)(state) === 'active',
    },
    {
      name: 'setHoverState',
      tooltip: 'Set hover state',
      icon: () => <span>:hov</span>,
      visible: true,
      active: () => getEmbedState(schema.nodes.embed)(state) === 'hover',
    },
    {
      name: 'separator',
      visible: isCollection,
    },
    {
      name: 'switchStyle',
      tooltip: 'Switch slide style',
      icon: ReplaceIcon,
      visible: isCollection,
      active: () => false,
    },
    {
      name: 'separator',
      visible: isCollection,
    },
    {
      name: 'autoplay',
      tooltip: 'Switch slide style',
      icon: ShuffleIcon,
      visible: isCollection,
      active: () => !!getEmbedParams(schema.nodes.embed)(state).get('autoplay'),
    },
    {
      name: 'separator',
      visible: true,
    },
    {
      name: 'deleteImage',
      tooltip: 'Remove module',
      icon: TrashIcon,
      visible: true,
      active: () => false,
    },
  ];
}
