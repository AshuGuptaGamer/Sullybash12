const ytdl = require('ytdl-core');
const { MessageEmbed, Client, VoiceConnection, TextChannel } = require('discord.js');
const { addCommand } = require('@abdevs/discord.js-utils');
const { category } = require('../config.json');

const queue = [];

/**
 * @param {string} url
 * @param {VoiceConnection} connection
 * @param {TextChannel} channel
 */
function playMusic(url, connection, channel) {
    queue.push(url);
    const dispatcher = connection.dispatcher;
    if (!dispatcher) play(connection, channel);
}

/**
 * @param {VoiceConnection} connection
 * @param {TextChannel} channel
 */
function play(connection, channel) {
    const url = queue[0];
    if (!url) return;
    const dispatcher = connection.play(ytdl(url, { quality: 'highestaudio' }));
    channel.send(new MessageEmbed({ description: `Now playing ${url}`, color: 'GREEN' }));
    const startNew = () => {
        queue.shift();
        play(connection, channel);
    };
    dispatcher.on('finish', startNew);
    dispatcher.on('close', startNew);
    dispatcher.on('error', (error) => {
        console.log(`Error while playing music. Error: ${error.message}`);
        queue.shift();
        play(connection, channel);
    });
}

module.exports = async (/** @type {Client} */ client) => {
    addCommand({
        command: 'play',
        handler: async (message, args) => {
            const { channel, member, guild } = message;
            if (!member) return;
            if (args.length === 0) return channel.send(new MessageEmbed({ description: 'You need to provide a youtube link to play', color: 'RED' }));
            if (!member.voice.channel) return channel.send(new MessageEmbed({ description: 'You need to be in a voice channel to play music', color: 'RED' }));
            if (guild.voice && guild.voice.channel && guild.voice.channel.id !== member.voice.channel.id)
                return channel.send(new MessageEmbed({ description: `Already playing music in ${guild.voice.channel.toString()}`, color: 'RED' }));
            const connection = await member.voice.channel.join();
            channel.send(new MessageEmbed({ description: `Added ${args[0]} to the queue`, color: 'GREEN' }));
            playMusic(args[0].trim(), connection, channel);
        },
        description: 'Plays music',
        category: category.music
    });

    addCommand({
        command: 'pause',
        handler: async (message) => {
            const { channel, member, guild } = message;
            if (!member) return;
            if (!member.voice.channel) return channel.send(new MessageEmbed({ description: 'You need to be in a voice channel to play music', color: 'RED' }));
            if (!guild.voice || !guild.voice.channel) return channel.send(new MessageEmbed({ description: 'I am not in a voice channel', color: 'RED' }));
            if (guild.voice.channel.id !== member.voice.channel.id)
                return channel.send(new MessageEmbed({ description: `You need to be in the same voice channel`, color: 'RED' }));
            const dispatcher = guild.voice.connection.dispatcher;
            if (!dispatcher) return channel.send(new MessageEmbed({ description: `The bot is not playing any music`, color: 'RED' }));
            if (dispatcher.paused) return channel.send(new MessageEmbed({ description: `Current music is already paused`, color: 'RED' }));
            dispatcher.pause();
            channel.send(new MessageEmbed({ description: `Paused the current music`, color: 'GREEN' }));
        },
        description: 'Pauses current playing music',
        category: category.music
    });

    addCommand({
        command: 'resume',
        handler: async (message) => {
            const { channel, member, guild } = message;
            if (!member) return;
            if (!member.voice.channel) return channel.send(new MessageEmbed({ description: 'You need to be in a voice channel to play music', color: 'RED' }));
            if (!guild.voice || !guild.voice.channel) return channel.send(new MessageEmbed({ description: 'I am not in a voice channel', color: 'RED' }));
            if (guild.voice.channel.id !== member.voice.channel.id)
                return channel.send(new MessageEmbed({ description: `You need to be in the same voice channel`, color: 'RED' }));
            const dispatcher = guild.voice.connection.dispatcher;
            if (!dispatcher) return channel.send(new MessageEmbed({ description: `The bot is not playing any music`, color: 'RED' }));
            if (!dispatcher.paused) return channel.send(new MessageEmbed({ description: `The bot is already resumed`, color: 'RED' }));
            dispatcher.resume();
            channel.send(new MessageEmbed({ description: `Resumed the current music`, color: 'GREEN' }));
        },
        description: 'Resumes current playing music',
        category: category.music
    });

    addCommand({
        command: 'stop',
        handler: async (message) => {
            const { channel, member, guild } = message;
            if (!member) return;
            if (!member.voice.channel) return channel.send(new MessageEmbed({ description: 'You need to be in a voice channel to play music', color: 'RED' }));
            if (!guild.voice || !guild.voice.channel) return channel.send(new MessageEmbed({ description: 'I am not in a voice channel', color: 'RED' }));
            if (guild.voice.channel.id !== member.voice.channel.id)
                return channel.send(new MessageEmbed({ description: `You need to be in the same voice channel`, color: 'RED' }));
            const dispatcher = guild.voice.connection.dispatcher;
            if (!dispatcher) return channel.send(new MessageEmbed({ description: `The bot is not playing any music`, color: 'RED' }));
            queue.length = 0;
            dispatcher.destroy();
            guild.voice.channel.leave();
            channel.send(new MessageEmbed({ description: `Stopped the current music and cleared the queue`, color: 'GREEN' }));
        },
        description: 'Stops current playing music',
        category: category.music
    });

    addCommand({
        command: 'queue',
        handler: async (message) => {
            const { channel, member, guild } = message;
            if (!member) return;
            if (!member.voice.channel) return channel.send(new MessageEmbed({ description: 'You need to be in a voice channel to play music', color: 'RED' }));
            if (!guild.voice || !guild.voice.channel) return channel.send(new MessageEmbed({ description: 'I am not in a voice channel', color: 'RED' }));
            if (guild.voice.channel.id !== member.voice.channel.id)
                return channel.send(new MessageEmbed({ description: `You need to be in the same voice channel`, color: 'RED' }));
            let description = `**Music Queue:**\n\`\`\`css\n`;
            if (queue.length === 0) description += `Queue empty\n`;
            else queue.forEach((url, i) => description += `${i + 1}) ${url}\n`);
            description += `\`\`\``;
            channel.send(new MessageEmbed({ description, color: 'GREEN' }));
        },
        description: 'List the current music queue',
        category: category.music
    });
};