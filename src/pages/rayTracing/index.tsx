import {useRef, useEffect} from 'react';

import {main} from "../../libs/rayTracing";

import './index.css';

function RayTracing() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    main(canvasRef.current);
  }, []);
  return <canvas ref={canvasRef} className="ray-tracing" width={1200} height={675}></canvas>;
}

export default RayTracing;