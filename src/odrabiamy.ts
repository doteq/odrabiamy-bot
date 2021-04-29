import axios from 'axios';
import { launch } from 'puppeteer';
import { ExerciseDetails, apiSolution } from "./types";

export default function getExerciseImage(exerciseDetails: ExerciseDetails, authorization: string): Promise<Buffer | null> {
    return new Promise(async (resolve) => {
        const response = await axios.request({
            method: 'GET',
            url: `https://odrabiamy.pl/api/v2/exercises/page/premium/${exerciseDetails.page}/${exerciseDetails.bookID}`,
            headers: {
                'user-agent': 'new_user_agent-huawei-142',
                Authorization: `Bearer ${authorization}`
            }
        });

        const solution = exerciseDetails.exerciseID
            ? response.data.data.filter((sol: apiSolution) => sol.id.toString() === exerciseDetails.exerciseID)[0].solution
            : response.data.data[0].solution;

        const browser = await launch({timeout: 100000});
        const page = await browser.newPage();
        await page.setViewport({width: 1920, height: 1});
        await page.setContent(decodeURI(solution));
        await page.waitForTimeout(1000)
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewport({width: 1920, height: bodyHeight});
        const screenshot = await page.screenshot({fullPage: true})

        if (Buffer.isBuffer(screenshot)) {
            resolve(screenshot)
        } else {
            resolve(null)
        }

        await browser.close();

        markAsVisited(exerciseDetails.exerciseID ? exerciseDetails.exerciseID : response.data.data[0].id, authorization)
    });
}

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
