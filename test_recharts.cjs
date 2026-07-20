const React = require('react');
const { ComposedChart, Bar, LabelList } = require('recharts');
const { renderToString } = require('react-dom/server');

const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400, isTeam1Wicket: true },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210, isTeam1Wicket: false }
];

const renderLabel = (props) => {
  console.log("LABEL VALUE:", props.value);
  return React.createElement('g');
};

const App = () => (
  React.createElement(ComposedChart, { width: 500, height: 300, data },
    React.createElement(Bar, { dataKey: 'uv' },
      React.createElement(LabelList, { dataKey: (d) => d, content: renderLabel })
    )
  )
);

renderToString(React.createElement(App));
