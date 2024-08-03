import { connect } from "react-redux";
import Home from "../Сomponents/home-page/Home";

const mapStateToProps = state => ({
    teams: state.teams
})

const mapDispatchToProps = dispatch => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Home)