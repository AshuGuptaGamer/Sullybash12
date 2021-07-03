class SpamHandler {
    /**
     * @param {number} timeout in ms
     * @param {number} messageCount
     */
    constructor(timeout, messageCount) {
        this._timeout = timeout;
        this._messageCount = messageCount;
        this._dataMap = new Map();
    }

    /**
     * @param {string} discordId
     * @return {boolean}
     */
    isSpamming(discordId) {
        if (!this._dataMap.has(discordId)) {
            this._dataMap.set(discordId, { count: 1 });
            setTimeout(() => this._dataMap.delete(discordId), this._timeout);
            return false;
        }
        const data = this._dataMap.get(discordId);
        if (data.count > this._messageCount) return true;
        data.count++;
        return false;
    }
}


/**
 * @param {number} xp
 * @param {number} start
 */
function levelCalc(xp, start) {
    let levels = 0;
    let last = start;
    while (true) {
        const result = levels ? last * 2 : last;
        last = result;
        if (xp < result) break;
        levels++;
    }
    return levels;
}

module.exports = {
    SpamHandler,
    levelCalc
};