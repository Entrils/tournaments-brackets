import { connect } from "react-redux";
import {
  generateTournamentBracket,
  requestMatchReplay,
  resetTournamentBracket,
  setMatchResult,
  setMatchWinner,
} from "../Actions";
import Bracket from "../components/bracket/Bracket";

const mapStateToProps = (state) => ({
  tournaments: state.tournaments,
});

const mapDispatchToProps = (dispatch) => ({
  setMatchWinner: (tournamentId, matchKey, winnerId) =>
    dispatch(setMatchWinner(tournamentId, matchKey, winnerId)),
  setMatchResult: (tournamentId, matchKey, result) =>
    dispatch(setMatchResult(tournamentId, matchKey, result)),
  requestMatchReplay: (tournamentId, matchKey) =>
    dispatch(requestMatchReplay(tournamentId, matchKey)),
  resetTournamentBracket: (tournamentId) => dispatch(resetTournamentBracket(tournamentId)),
  generateTournamentBracket: (tournamentId) =>
    dispatch(generateTournamentBracket(tournamentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Bracket);
