import d3 from 'd3';

const DOUBLE_CLICK_TIMEOUT = 300; // win7 default is 500 ms

/*
 * Use this function if you need both single-click and double-click handlers on
 * a node.  If you only need one or the other, simply listen to the 'click' and
 * 'dblclick' events.  Otherwise, you can use this function as follows:
 *
 * d3.select('.someclass').
 *   on('click', multiClicker([
 *     function(d, i) { // single click handler
 *       // do single-click stuff with "d", "i", or "d3.select(this)", as usual
 *     },
 *     function(d, i) { // double click handler
 *       // do double-click stuff with "d", "i", or "d3.select(this)", as usual
 *     },
 *   ]));
 *
 */
export default function multiClicker(handlers) {
  let timer = null;
  const singleClick = handlers[0];
  const doubleClick = handlers[1];
  let clickEvent = null;

  return function inner() {
    clearTimeout(timer);
    /* eslint-disable prefer-rest-params */
    const args = Array.prototype.slice.call(arguments, 0);
    /* eslint-enable prefer-rest-params */
    if (timer === null) {
      clickEvent = d3.event;
      timer = setTimeout(() => {
        timer = null;
        d3.event = clickEvent;
        singleClick.apply(this, args);
      }, DOUBLE_CLICK_TIMEOUT);
    } else {
      timer = null;
      doubleClick.apply(this, args);
    }
  };
}
