import puppeteer from 'puppeteer'

export default function getExerciseImage(solution: string, excercise_number: string, page_number: string): Promise<Buffer | null> {
    return new Promise(async (resolve) => {

        
        const browser = await puppeteer.launch({timeout: 100000});
        const page = await browser.newPage();
        await page.setViewport({width: 780, height: 1});
        let decoded_solution = solution
        decoded_solution = `<h1 style="font-size:30;"> ${excercise_number}/${page_number} </h1>` + decoded_solution
        decoded_solution = '<style>html * {font-family: MulishVariable,sans-serif;}</style>' + decoded_solution
        decoded_solution = decoded_solution.replaceAll(/<object class="math small".*?>/g, '')
        const loaded = page.waitForNavigation({waitUntil: 'load'});
        await page.setContent(decoded_solution, {waitUntil: 'networkidle0'});
        await loaded
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        await page.setViewport({width: bodyWidth, height: bodyHeight});
        const screenshot = await page.screenshot({fullPage: true})

        if (Buffer.isBuffer(screenshot)) {
            resolve(screenshot)
        } else {
            resolve(null)
        }

        await browser.close();


    });
}


