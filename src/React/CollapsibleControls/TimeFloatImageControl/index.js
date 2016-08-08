import React                    from 'react';

import style                    from 'PVWStyle/ReactCollapsibleControls/FloatImageControl.mcss';

import CollapsibleWidget        from '../../Widgets/CollapsibleWidget';
import InlineToggleButtonWidget from '../../Widgets/InlineToggleButtonWidget';
import ToggleIconButtonWidget   from '../../Widgets/ToggleIconButtonWidget';

export default React.createClass({

  displayName: 'TimeFloatImageControl',

  propTypes: {
    model: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      change: false,
    };
  },

  componentWillMount() {
    this.attachListener();
  },

  componentWillReceiveProps(nextProps) {
    var previous = this.props.model,
      next = nextProps.model;

    if (previous !== next) {
      // Force redraw
      this.attachListener();
      this.setState({ change: !this.state.change });
    }
  },

  componentWillUnmount() {
    this.removeListener();
  },


  onActiveView(obj, activeView) {
    this.props.model.setActiveView(activeView);
    this.forceUpdate();
  },

  attachListener() {
    this.removeListener();
    this.subscription = this.props.model.probeManager.onChange(() => {
      this.forceUpdate();
    });
  },

  removeListener() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  },

  addProbe() {
    this.props.model.probeManager.addProbe();
    this.props.model.render();
    this.forceUpdate();
  },

  removeProbe() {
    const activeProbe = this.props.model.probeManager.getActiveProbe();
    if (activeProbe) {
      this.props.model.probeManager.removeProbe(activeProbe.name);
      this.props.model.render();
      this.forceUpdate();
    }
  },

  updateProbe(event) {
    const name = event.target.name;
    const value = event.target.value;
    const activeProbe = this.props.model.probeManager.getActiveProbe();

    if (name === 'name') {
      activeProbe.updateName(value);
    } else {
      const idx = Number(name);
      const extent = [].concat(activeProbe.getExtent());
      extent[idx] = Number(value);
      activeProbe.updateExtent(...extent);
    }
  },

  updateActive(e) {
    const name = e.target.value;
    this.props.model.probeManager.setActiveProbe(name);
  },

  toggleProbe(e) {
    var target = e.target;
    while (!target.dataset.name) {
      target = target.parentNode;
    }
    const name = target.dataset.name;
    const enable = !Number(target.dataset.active);
    this.props.model.enableProbe(name, enable);
  },

  sortProbes() {
    this.props.model.sortProbesByName();
  },

  render() {
    const probeManager = this.props.model.probeManager;
    const { queryDataModel } = this.props.model.getControlModels();
    const timeIdx = queryDataModel.getIndex('time');
    const chartData = this.props.model.chartData;
    const activeView = this.props.model.getActiveView();
    const buttons = [<ToggleIconButtonWidget key="0" toggle={false} className={style.addProbeIcon} icon="" onChange={this.addProbe} />];
    const activeProbe = probeManager.getActiveProbe();
    if (activeProbe) {
      buttons.push(<ToggleIconButtonWidget key="1" toggle={false} className={style.removeProbeIcon} icon="" onChange={this.removeProbe} />);
    }
    const sortProbes = <ToggleIconButtonWidget toggle={false} className={style.sortProbeIcon} icon="" onChange={this.sortProbes} />;

    // Put minus before
    buttons.reverse();

    return (
      <div className={style.container}>
        <div style={{ padding: '10px 5px 5px' }}>
          <InlineToggleButtonWidget
            options={[{ icon: style.imageViewIcon }, { icon: style.bothViewIcon }]}
            activeColor="#ccc"
            defaultColor="rgba(0,0,0,0)"
            active={activeView}
            onChange={this.onActiveView}
          />
        </div>
        <CollapsibleWidget title="Time probes" activeSubTitle subtitle={buttons} visible>
          <section className={style.item}>
            <label className={style.smallLabel}>Name</label>
            <input className={style.input} type="text" name="name" value={activeProbe ? activeProbe.name : '' || ''} onChange={this.updateProbe} />
            <select className={style.dropDown} value={undefined} onChange={this.updateActive}>
              {probeManager.getProbeNames().map((name, index) =>
                <option key={index} value={name}>{name}</option>
              )}
            </select>
          </section>
          <section className={style.item}>
            <label className={style.smallLabel}>X</label>
            <input className={style.input} type="number" name="0" value={activeProbe ? activeProbe.extent[0] : 0} onChange={this.updateProbe} />
            <input className={style.input} type="number" name="1" value={activeProbe ? activeProbe.extent[1] : 5} onChange={this.updateProbe} />
          </section>
          <section className={style.item}>
            <label className={style.smallLabel}>Y</label>
            <input className={style.input} type="number" name="2" value={activeProbe ? activeProbe.extent[2] : 0} onChange={this.updateProbe} />
            <input className={style.input} type="number" name="3" value={activeProbe ? activeProbe.extent[3] : 5} onChange={this.updateProbe} />
          </section>
        </CollapsibleWidget>
        <CollapsibleWidget title="Legend" visible={activeView > 0} activeSubTitle subtitle={sortProbes}>
          {chartData.fields.map((field, index) =>
            <section key={index} className={style.item} data-name={field.name} data-active={field.active ? '1' : '0'}>
              <label className={style.label}>
                <i className={field.active ? style.enableLegendIcon : style.disableLegendIcon} style={{ color: field.color }} />
                {field.name}
              </label>
              <span className={style.value} title={field.data[timeIdx]}>{field.data[timeIdx]}</span>
            </section>
          )}
        </CollapsibleWidget>
      </div>);
  },
});
