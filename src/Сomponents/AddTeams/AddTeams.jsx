import React, { Component } from 'react'
import styles from './AddTeams.module.css'
import Team from '../../Models/Team'

class AddTeams extends Component {
  constructor(props){
    super(props)

    this.state = {
      team: new Team(
        "",
        ""
      )
    }

    this.submitTeam = this.submitTeam.bind(this);
  }
  
  submitTeam(){
   let team = this.state;
   console.log(team)
  }

  render(){
    return (
    <div className={styles.container}>
        <h1>Add a team</h1>

        <div>
          <div className='form-group'>
            <label>Name: </label>
            <input className='form-control'/>
          </div>
          <div className='form-group'>
            <label>Image Url: </label>
            <input className='form-control'/>
          </div>


          <button  onClick={this.submitTeam}
          className='btn btn-success'> 
            Submit
          </button>
        </div>

    </div>
    )
  }
}

export default AddTeams