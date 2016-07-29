import React from 'react';
import TwoByTwo from './TwoByTwo';
import OneByTwo from './OneByTwo';
import TwoByOne from './TwoByOne';
import OneByOne from './OneByOne';
import TwoLeft from './TwoLeft';
import TwoTop from './TwoTop';
import TwoRight from './TwoRight';
import TwoBottom from './TwoBottom';

export default function layoutsWidget(props) {
  const onLayoutChange = event => props.onChange(event.currentTarget.getAttribute('name'));

  return (
    <section className={props.className}>
      <TwoByTwo active={props.active} onClick={onLayoutChange} />
      <OneByTwo active={props.active} onClick={onLayoutChange} />
      <TwoByOne active={props.active} onClick={onLayoutChange} />
      <OneByOne active={props.active} onClick={onLayoutChange} />
      <TwoLeft active={props.active} onClick={onLayoutChange} />
      <TwoTop active={props.active} onClick={onLayoutChange} />
      <TwoRight active={props.active} onClick={onLayoutChange} />
      <TwoBottom active={props.active} onClick={onLayoutChange} />
    </section>);
}

layoutsWidget.propTypes = {
  onChange: React.PropTypes.func,
  active: React.PropTypes.string,
  className: React.PropTypes.string,
};

layoutsWidget.defaultProps = {
  onChange: () => {},
};
