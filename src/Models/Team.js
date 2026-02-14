import {uid} from 'uid'

class Team {

    constructor(name,img_url, rating = null, manualSeed = null){
        this.id =uid()
        this.name = name;
        this.img_url = img_url;
        this.rating = rating;
        this.manualSeed = manualSeed;
    }

}
export default Team;
