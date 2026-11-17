import React, { useState, useEffect } from 'react';

export default function App() {
  const [config, setConfig] = useState({
    option_a: 'Cats',
    option_b: 'Dogs',
    hostname: '',
    vote: null,
  });
  const [currentVote, setCurrentVote] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        if (data.vote) {
          setCurrentVote(data.vote);
        }
      })
      .catch((err) => console.error('Failed to load initial vote config:', err));
  }, []);

  const handleVote = async (choice) => {
    setLoading(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: choice }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentVote(choice);
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
    } finally {
      setLoading(false);
    }
  };

  const isA = currentVote === 'a';
  const isB = currentVote === 'b';

  return (
    <div id="content-container">
      <div id="content-container-center">
        <h3>{config.option_a} vs {config.option_b}!</h3>
        <div id="choice">
          <button
            id="a"
            type="button"
            className="a"
            disabled={loading || isA}
            style={{ opacity: isB ? 0.5 : 1 }}
            onClick={() => handleVote('a')}
          >
            {config.option_a}
            {isA && <i className="fa fa-check-circle" style={{ float: 'right', paddingRight: '30px', marginTop: '3px' }} />}
          </button>
          <button
            id="b"
            type="button"
            className="b"
            disabled={loading || isB}
            style={{ opacity: isA ? 0.5 : 1 }}
            onClick={() => handleVote('b')}
          >
            {config.option_b}
            {isB && <i className="fa fa-check-circle" style={{ float: 'right', paddingRight: '30px', marginTop: '3px' }} />}
          </button>
        </div>
        <div id="tip">
          (Tip: you can change your vote)
        </div>
        <div id="hostname">
          Processed by container ID {config.hostname || '...'}
        </div>
      </div>
    </div>
  );
}
