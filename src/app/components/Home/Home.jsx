import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import classes from './Home.module.css';

function Home() {
  const socket = useRef();
  const scriptText = useRef();

  const [started, setStarted] = useState(false);

  useEffect(() => {
    socket.current = io();
    socket.current.on('stdOut', (msg) => {
      scriptText.current.textContent = scriptText.current.textContent + msg;
      scriptText.current.scrollTop = scriptText.current.scrollHeight;
    });
  }, []);

  const handleRun = () => {
    setStarted(true);
    socket.current.emit('run');
  };
  return (
    <div className={classes.homeDiv}>
      {!started ? <button onClick={handleRun}>Start Script</button> : null}
      {started ? (
        <textarea
          className={classes.scriptTextContainer}
          ref={scriptText}
        ></textarea>
      ) : null}
    </div>
  );
}

export default Home;
