import {useRef, useEffect} from 'react';

import {Game} from './game';

import './index.css';

const game = new Game();

function GameOfLife() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    game.initialize(canvasRef.current).then(() => {
      game.render();
    })
  }, []);

  return <canvas ref={canvasRef} className="game-of-life" width={512} height={512}></canvas>;
}

export default GameOfLife;
