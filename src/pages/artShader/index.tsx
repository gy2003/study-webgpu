import {useRef, useEffect} from 'react';

import {Shader} from "./shader";

import './index.css';

const shader = new Shader();

function ArtShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    shader.initialize(canvasRef.current).then(() => {
      shader.render();
    });
  }, []);

  return <canvas ref={canvasRef} className="art-shader" width={512} height={512}></canvas>;
}

export default ArtShader;