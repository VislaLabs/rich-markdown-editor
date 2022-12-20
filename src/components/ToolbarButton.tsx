import styled from 'styled-components';

type Props = { active?: boolean; disabled?: boolean };

export default styled.button<Props>`
  display: inline-block;
  flex: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  margin-left: 8px;
  border: none;
  background: none;
  transition: opacity 100ms ease-in-out;
  padding: 0;
  outline: none;
  pointer-events: all;
  position: relative;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    color: var(---tool-color-active);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:before {
    position: absolute;
    content: '';
    top: -4px;
    right: -4px;
    left: -4px;
    bottom: -4px;
  }

  ${props => props.active && 'color: var(--text-color);'};
`;
