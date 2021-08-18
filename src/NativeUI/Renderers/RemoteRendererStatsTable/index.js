import style from 'PVWStyle/NativeUI/RemoteRendererStatsTable.mcss';
import htmlTemplate from 'paraviewweb/src/NativeUI/Renderers/RemoteRendererStatsTable/template.html';

export default class RemoteRendererStatsTable {
  constructor(container = null) {
    this.container = container;
    this.visible = false;
    this.statData = {};
  }

  setContainer(container = null) {
    if (this.container && this.container !== container) {
      // Clean previous container
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }

      this.container = null;
    }

    if (container && this.container !== container) {
      this.container = container;
      this.container.innerHTML = htmlTemplate;
      this.container
        .querySelector('.render-stats-table')
        .classList.add(style.statTable);
    }
  }

  updateData(stats, show) {
    this.statData = Object.assign(this.statData, stats);
    this.visible = show;
  }

  render() {
    if (this.container) {
      if (this.visible) {
        const avgDeltaT =
          this.statData.deltaT.reduce((prev, cur) => prev + cur) /
          this.statData.deltaT.length;
        const avgRoundTrip =
          this.statData.roundTrip.reduce((prev, cur) => prev + cur) /
          this.statData.roundTrip.length;
        const avgWorkTime =
          this.statData.workTime.reduce((prev, cur) => prev + cur) /
          this.statData.workTime.length;

        this.container
          .querySelector('.render-stats-table')
          .classList.remove(style.hidden);

        this.container.querySelector(
          '.total-frames-value'
        ).innerHTML = `${this.statData.renderCount}`;
        this.container.querySelector(
          '.stale-frames-value'
        ).innerHTML = `${this.statData.staleRenderCount}`;
        this.container.querySelector(
          '.avg-network-time-value'
        ).innerHTML = `${avgRoundTrip.toFixed(1)} ms`;
        this.container.querySelector(
          '.avg-server-time-value'
        ).innerHTML = `${avgWorkTime.toFixed(1)} ms`;
        this.container.querySelector('.avg-framerate-value').innerHTML = `${(
          1000 / avgDeltaT
        ).toFixed(1)} fps`;
      } else {
        this.container
          .querySelector('.render-stats-table')
          .classList.add(style.hidden);
      }
    }
  }

  resize() {
    this.render();
  }

  destroy() {
    this.setContainer(null);
  }
}
