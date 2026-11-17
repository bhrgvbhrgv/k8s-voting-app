import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const [aPercent, setAPercent] = useState(50);
  const [bPercent, setBPercent] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.body.style.opacity = '1';

    const socket = io();

    socket.on('scores', (json) => {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        const a = parseInt(data.a || 0, 10);
        const b = parseInt(data.b || 0, 10);
        const sum = a + b;

        let pctA = 50;
        let pctB = 50;
        if (sum > 0) {
          pctA = Math.round((a / sum) * 100);
          pctB = 100 - pctA;
        }

        setAPercent(pctA);
        setBPercent(pctB);
        setTotal(sum);
      } catch (err) {
        console.error('Error parsing scores:', err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div id="background-stats">
        <div id="background-stats-1" style={{ width: `${aPercent}%` }}></div>
        <div id="background-stats-2" style={{ width: `${bPercent}%` }}></div>
      </div>
      <div id="content-container">
        <div id="content-container-center">
          <div id="choice">
            <div className="choice cats">
              <div className="label">Cats</div>
              <div className="stat">{aPercent}%</div>
            </div>
            <div className="divider"></div>
            <div className="choice dogs">
              <div className="label">Dogs</div>
              <div className="stat">{bPercent}%</div>
            </div>
          </div>
        </div>
      </div>
      <div id="result">
        {total === 0 && <span>No votes yet</span>}
        {total === 1 && <span>1 vote</span>}
        {total >= 2 && <span>{total} votes</span>}
      </div>
    </>
  );
}
