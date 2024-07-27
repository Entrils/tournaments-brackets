import { Route, Routes } from 'react-router';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import {Home} from './Сomponents/home-page/Home';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div>
          <Routes>
          <Route exact path='/' element={<Home/>}/>
          {/*<Route path='/add_teams' component={AddTeamsContainer}/>
          <Route path='/match_view' component={MatchViewContainer}/>
          <Route path='/game-won' component={WinnerContainer}/>*/}
           </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
