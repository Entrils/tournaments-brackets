import { Route, Routes } from 'react-router';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import HomeContainer from './Containers/HomeContainer';
import AddTeamsContainer from './Containers/AddTeamsContainer';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div>
          <Routes>
          <Route exact path='/' element={<HomeContainer/>}/>
          <Route path='/add_teams' element={<AddTeamsContainer/>}/>
          {/*<Route path='/match_view' component={MatchViewContainer}/>
          <Route path='/game-won' component={WinnerContainer}/>*/}
           </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
