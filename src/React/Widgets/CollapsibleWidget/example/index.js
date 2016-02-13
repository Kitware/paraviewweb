import CollapsibleWidget from '..';
import React             from 'react';
import ReactDOM          from 'react-dom';

const Accordion = React.createClass({

    displayName: 'Accordion',

    render() {
    	var mainStyle = {
    		border: '1px solid grey',
    	};

      return (
        <main style={mainStyle}>
          <CollapsibleWidget title="Charmander" subtitle="stage 1">
          	<img src="http://media.giphy.com/media/Rs8APEp9KGBjy/giphy.gif" />
          </CollapsibleWidget>
          <CollapsibleWidget title="Charmeleon" subtitle="stage 2" open={false}>
          	<img src="http://media.giphy.com/media/ijnAEnJI6oZG0/giphy.gif" />
          </CollapsibleWidget>
          <CollapsibleWidget title="Charizard" subtitle="final form" open={false}>
          	<img src="http://media.giphy.com/media/11sXoLLZGXwcvu/giphy.gif" />
          </CollapsibleWidget>
        </main>
      );
    },
});

ReactDOM.render(<Accordion/>, document.querySelector('.content'));
