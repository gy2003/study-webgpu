import {createBrowserRouter} from 'react-router-dom';

import App from "./App";
import GameOfLife from './pages/gameOfLife';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "game-of-life",
        element: <GameOfLife />
      }
    ],
  }
]);