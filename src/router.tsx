import {createBrowserRouter} from 'react-router-dom';

import App from "./App";
import GameOfLife from './pages/gameOfLife';
import ArtShader from "./pages/artShader";
import RayTracing from "./pages/rayTracing";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "game-of-life",
        element: <GameOfLife />
      },
      {
        path: "art-shader",
        element: <ArtShader />
      },
      {
        path: "ray-tracing",
        element: <RayTracing />
      }
    ],
  }
]);