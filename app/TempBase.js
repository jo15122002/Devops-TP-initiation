//singleton
class TempBase {
    constructor() {
        if (TempBase.instance) {
            return TempBase.instance;
        }
        TempBase.instance = this;
        this.uploadComplete = false;
    }
    // other methods
}

const instance = new TempBase();

export default instance;