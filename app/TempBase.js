//singleton
class TempBase {
    uploadComplete = false;



    constructor() {
        if (TempBase.instance) {
            return TempBase.instance;
        }
        TempBase.instance = this;
    }
    // other methods
}

const instance = new TempBase();

export default instance;