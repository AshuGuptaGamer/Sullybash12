const { Client } = require('discord.js');
const { token, prefix } = require('./config.json');
const utils = require('@abdevs/discord.js-utils');
const executor = require('@abdevs/js-file-executor');

const client = new Client();

client.on('ready', () => console.log(`Logged in with ${client.user.tag}...`));

utils.init(client, { isCmdManager: true, isHelpCommand: true, prefix });

executor('./commands', client);

client.login(token);