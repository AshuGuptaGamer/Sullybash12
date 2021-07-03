const db = require("better-sqlite3")('./levels.sqlite');
const { category, levelSpamTimeout, levelSpamMessages, levelSaveCycle, xpPerMessage, xpPerLevel } = require('../config.json');
const { MessageEmbed, Client } = require('discord.js');
const { addCommand, fetchUser } = require('@abdevs/discord.js-utils');
const { SpamHandler, levelCalc } = require('../utils');

const levelCacheData = [];

db.prepare('CREATE TABLE IF NOT EXISTS levels (discordId TEXT NOT NULL, xp INTEGER NOT NULL)').run();

/**
 * @param {string} discordId
 */
function getUser(discordId) {
    return db.prepare('SELECT * FROM levels WHERE discordId = ?').get(discordId);
}

function getTopUsers() {
    const all = db.prepare(`SELECT * FROM levels`).all();
    return all.sort((a, b) => a.xp - b.xp).reverse();
}

/**
 * @param {string} discordId
 * @param {number} xp
 */
async function addXP(discordId, xp) {
    const user = getUser(discordId);
    if (user) db.prepare('UPDATE levels SET xp = ? WHERE discordId = ?').run(xp + user.xp, discordId);
    else db.prepare('INSERT INTO levels (discordId, xp) VALUES(?, ?)').run(discordId, xp);
}

/**
 * @param {string} discordId
 * @return {number}
 */
function getXP(discordId) {
    const user = getUser(discordId);
    return user ? user.xp : 0;
}

module.exports = async (/** @type {Client} */ client) => {
    const spamHandler = new SpamHandler(levelSpamTimeout * 1000, levelSpamMessages);
    client.on('message', (message) => {
        const { author, guild } = message;
        if (!guild || author.bot) return;
        if (spamHandler.isSpamming(author.id)) return;
        const i = levelCacheData.findIndex(data => data.discordId === author.id);
        if (i === -1) levelCacheData.push({ discordId: author.id, xp: xpPerMessage });
        else levelCacheData[i].xp += xpPerMessage;
    });

    setInterval(() => {
        if (levelCacheData.length === 0) return;
        levelCacheData.forEach(data => addXP(data.discordId, data.xp));
        levelCacheData.length = 0;
    }, levelSaveCycle * 1000);

    addCommand({
        command: 'level',
        handler: async (message, args) => {
            const { channel, guild, author } = message;
            if (!guild) return;
            let target = author;
            if (args.length !== 0) {
                const user = await fetchUser(args[0]);
                if (user) target = user;
            }
            const xp = getXP(target.id);
            const level = levelCalc(xp, xpPerLevel);
            channel.send(new MessageEmbed({ author: { name: target.tag }, fields: [{ name: 'Levels', value: level }], color: 'GREEN' }));
        },
        description: 'Shows user level',
        category: category.levels
    });
    addCommand({
        command: 'xp',
        handler: async (message, args) => {
            const { author, channel, guild } = message;
            if (!guild) return;
            let target = author;
            if (args.length !== 0) {
                const user = await fetchUser(args[0]);
                if (user) target = user;
            }
            const xp = getXP(target.id);
            channel.send(new MessageEmbed({ author: { name: target.tag }, fields: [{ name: 'XP', value: xp }], color: 'GREEN' }));
        },
        description: 'Shows user total xp',
        category: category.levels
    });
    addCommand({
        command: 'leaderboard',
        handler: async (message) => {
            const { channel, guild } = message;
            if (!guild) return;
            const users = getTopUsers();
            users.length = 10;
            let description = ``;
            users.forEach((data, i) => description += `${i + 1}) <@${data.discordId}> - **XP:** \`${data.xp}\` **Level:** \`${levelCalc(data.xp, xpPerLevel)}\`\n`);
            channel.send(new MessageEmbed({ author: { name: `Leaderboard` }, description, color: 'BLUE' }));
        },
        description: 'Tops users',
        category: category.levels
    });
};