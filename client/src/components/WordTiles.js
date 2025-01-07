import React from 'react';

const WordTiles = ({ commonWord, revealedLetters }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px' }}>
      {commonWord.split('').map((char, index) => (
        <div
          key={index}
          className={`tile word-tile ${revealedLetters[index] ? 'hidden' : 'revealed'}`}
        >
          <div className="word-tile-inner">
            <div className="word-tile-front"></div>
            <div className="word-tile-back">{char}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WordTiles;