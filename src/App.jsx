import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import HomeContainer from "./Containers/HomeContainer";
import AddTeamsContainer from "./Containers/AddTeamsContainer";
import BracketContainer from "./Containers/BracketContainer";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeContainer />} />
          <Route path="/tournament/:tournamentId/teams" element={<AddTeamsContainer />} />
          <Route path="/tournament/:tournamentId/bracket" element={<BracketContainer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
