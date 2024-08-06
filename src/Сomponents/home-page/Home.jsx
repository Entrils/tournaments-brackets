/* eslint-disable array-callback-return */
import React, { Component } from 'react'
import styles from './Home.module.css'

class Home extends Component {
 
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
  return (
    <div className={styles.homePage}>
        <h1 className={styles.title}>Welcome to the Home Page</h1>
        <div className={styles.container}>
          <button 
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