import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';
export {routes,services,business} from './data';
export function render(path:string){return renderToString(createElement(App,{path}));}
