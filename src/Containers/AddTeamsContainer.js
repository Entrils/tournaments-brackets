import { connect } from "react-redux";
import { AddTeams } from "../Сomponents/AddTeams/AddTeams";
import { addTeam } from "../Actions";

const mapStateToProps = state => ({
    
})

const mapDispatchToProps = dispatch => ({
    AddTeams: (team) => {
        dispatch(addTeam(team));
    }
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AddTeams)