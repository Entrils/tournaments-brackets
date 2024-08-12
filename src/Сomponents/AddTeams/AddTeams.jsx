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
    this.handleInputChange = this.handleInputChange.bind(this);
  }
  
  submitTeam(){
   let team = this.state;
   console.log(team)
  }

  handleInputChange(e, type){
    e.preventDefault();

    let value = e.target.value;
    let new_state = this.state;
    new_state.team[type] = value;

    this.setState(new_state)
  }

  render(){
    return (
    <div className={styles.container}>
        <h1>Add a team</h1>

        <div>
          <div className='form-group' key={this.state.team.id}>
            <label>Name: </label>
            <input onChange={(e) => this.handleInputChange(e,"name")}
            value={this.state.team.name}
            className='form-control'/>
          </div>
          <div className='form-group'>
            <label>Image Url: </label>
            <input onChange={(e) => this.handleInputChange(e,"img_url")} 
            value={this.state.team.img_url}
            className='form-control'/>
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