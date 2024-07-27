import {uid} from 'uid'

class Team {

    constructor(name,img_url){
        this.id =uid()
        this.name = name;
        this.img_url = img_url;
    }

}
export default Team;