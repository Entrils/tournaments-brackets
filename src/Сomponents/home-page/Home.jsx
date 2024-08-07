/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
import React, { Component } from 'react'
import styles from './Home.module.css'
import { Navigate } from 'react-router';

class Home extends Component {
 
  constructor(props){
    super(props)
    this.state = {
      addTeam: false  
    }

    this.renderTeams = this.renderTeams.bind(this);
    this.addTeam = this.addTeam.bind(this);
  }

  addTeam() {
    var new_state = this.state;
    new_state.addTeam =  true;
    this.setState(new_state)
  }

  renderTeams(){
    let team_renders = [];
    this.props.teams.map(function(team){
      team_renders.push(
        <p>{team.name} {team.id}</p>
      )
    });
    return team_renders;
  }
  
render(){

  if (this.state.addTeam === true) {
    return (
      <Navigate to="/add_teams"/>
    )
  }

  return (
    <div className={styles.homePage}>
        <h1 className={styles.title}>Welcome to the Home Page</h1>
        <div className={styles.container}>
          <button onClick={this.addTeam}
          type="button" className='btn btn-block btn-primary'>Add Team</button>
          
          <div className={styles.teams}>
            {this.renderTeams()}
          </div>
        </div>
    </div>
  )
}
}

export default Home