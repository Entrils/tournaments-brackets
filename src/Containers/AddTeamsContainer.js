import { connect } from "react-redux";
import { addTeam, deleteTeam, updateTeam } from "../Actions";
import AddTeams from "../components/add-teams/AddTeams";

const mapStateToProps = (state) => ({
  tournaments: state.tournaments,
});

const mapDispatchToProps = (dispatch) => ({
  addTeam: (tournamentId, team) => dispatch(addTeam(tournamentId, team)),
  updateTeam: (tournamentId, team) => dispatch(updateTeam(tournamentId, team)),
  deleteTeam: (tournamentId, teamId) => dispatch(deleteTeam(tournamentId, teamId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddTeams);
