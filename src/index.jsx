import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware } from 'redux'
import { rootReducer  } from './reducers';

const loggerMiddleware = createLogger();

const store = createStore(rootReducer, applyMiddleware(
  loggerMiddleware
))

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store = {store}>
    <App />
    </Provider>
    
  </React.StrictMode>
);
reportWebVitals();
