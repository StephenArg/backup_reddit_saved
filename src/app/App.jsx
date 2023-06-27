import React from 'react';
import styles from './App.module.css';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './components/Home/Home.jsx';

function App() {
  return (
    <Router>
      <div className={styles.App}>
        <header className={styles['App-header']}>
          <Switch>
            <Route path="/about">
              <main>About</main>
            </Route>
            <Route path="/">
              <main>
                <Home></Home>
              </main>
            </Route>
          </Switch>
        </header>
      </div>
    </Router>
  );
}

export default App;
