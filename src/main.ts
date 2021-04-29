import { Client, Message } from 'discord.js';
import { ExerciseDetails } from "./types";
import odrabiamy from './odrabiamy';

import config from './config'

const client = new Client();

export function ready() {
    console.log(`Logged in as ${client.user?.tag}`)
}

client.on('ready', ready);
client.on('message', async (message: Message) => {
    if (message.author.bot) return;
    if (!config.channels.includes(message.channel.id)) return;
    if (!message.content.includes('odrabiamy.pl')) return;

    const urlArgs = message.content.split('odrabiamy.pl')[1].split('/');
    const exerciseDetails: ExerciseDetails = {
        bookID: urlArgs[2].split('-')[1],
        page: urlArgs[3].split('-')[1],
        exerciseID: urlArgs[4]?.split('-')[1],
    }

    const solutionScreenshot: Buffer | null = await odrabiamy(exerciseDetails, config.odrabiamyAuth);

    if (!solutionScreenshot) return message.channel.send('Wystąpił błąd przy pobieraniu zadania');

    await message.channel.send({
        files: [solutionScreenshot],
    })
})

client.login(config.token)



