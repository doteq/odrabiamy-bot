import { Client, Message } from 'discord.js';
import { apiSolution, ExerciseDetails } from "./types";
import odrabiamy from './odrabiamy';
import fullpage from './fullpage'

import config from './config'
import axios from 'axios';

const client = new Client();

export function ready(): void {
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

    if (message.content.includes('!str')) {
        const response = await axios.request({
            method: 'GET',
            url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
            headers: {
                'user-agent': 'new_user_agent-huawei-142',
                Authorization: `Bearer ${config.odrabiamyAuth}`
            }
        });
        for (let num = 0; num < response.data.data.length; num++) {
            let solution = response.data.data[num].solution;
            solution = decodeURI(solution)
            const excercise_number = response.data.data[num].number;
            const page_number = exerciseDetails.page
            const solutionScreenshot = await request(solution, excercise_number, page_number)
            markAsVisited(response.data.data[num].id, config.odrabiamyAuth);
            if (!solutionScreenshot) break;
        
            await message.channel.send({
                files: [solutionScreenshot],
            })
        }

    } else if (message.content.includes('!split')) {
        const response = await axios.request({
            method: 'GET',
            url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
            headers: {
                'user-agent': 'new_user_agent-huawei-142',
                Authorization: `Bearer ${config.odrabiamyAuth}`
            }
        });

        let solution = exerciseDetails.exerciseID
        ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].solution
        : response.data.data[0].solution;
        solution = decodeURI(solution)

        const excercise_number = exerciseDetails.exerciseID 
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].number
            : response.data.data[0].number;

        const page_number = exerciseDetails.page

        const subsection = solution.split('<hr>')

        for (const element of subsection){
            const solutionScreenshot = await request(element, excercise_number, page_number)
            markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, config.odrabiamyAuth);
            if (!solutionScreenshot) return message.channel.send('Wystąpił błąd przy pobieraniu zadania');
    
            await message.channel.send({
                files: [solutionScreenshot],
            })
        }

        
    } else {
        const solutionScreenshot: Buffer | null = await odrabiamy(exerciseDetails, config.odrabiamyAuth);
        
            if (!solutionScreenshot) return message.channel.send('Wystąpił błąd przy pobieraniu zadania');
        
            await message.channel.send({
                files: [solutionScreenshot],
            })
    }

    try {
        message.delete()
    } catch (error) {
        console.log('message delete failed')
    }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(solution: string, excercise_number: string, page_number: string,){

    const solutionScreenshot: Buffer | null = await fullpage(solution, excercise_number, page_number);
    return solutionScreenshot;
}

client.login(config.token)

function markAsVisited(exerciseID: string, authorization: string) {
    axios.request({
        method: 'POST',
        url: `https://odrabiamy.pl/api/v2/exercises/${exerciseID}/visited`,
        headers: {
            'user-agent': 'new_user_agent-huawei-142',
            Authorization: `Bearer ${authorization}`,
        }
    })
}

