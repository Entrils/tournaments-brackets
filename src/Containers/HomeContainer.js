import { connect } from "react-redux";
import { createTournament, deleteTournament } from "../Actions";
import Home from "../components/home-page/Home";

const mapStateToProps = (state) => ({
  tournaments: state.tournaments,
});

const mapDispatchToProps = (dispatch) => ({
  createTournament: (name, mode) => dispatch(createTournament(name, mode)),
  deleteTournament: (tournamentId) => dispatch(deleteTournament(tournamentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Home);
