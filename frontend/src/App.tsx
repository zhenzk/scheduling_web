import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './routes/AppRouter';
import './index.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
