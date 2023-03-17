import puppeteer, { Page } from 'puppeteer';
import { log } from './logging';
import { CodenamesGamePage } from './page-interactions';
import { Spymaster } from './spymaster';
import { Configuration, OpenAIApi } from 'openai';
import env from "./environment";
(()=>{
    let roomCode = process.argv[2];
    spymaster(roomCode, "not-a-robot-red", "red");
    spymaster(roomCode, "not-a-robot-blue", "blue");
})();


async function spymaster(roomCode: string, spymasterNickname: string, side: "red" | "blue") {
    const configuration = new Configuration({ apiKey: env.OPENAI_API_KEY });
    const api = new OpenAIApi(configuration);
    let spymaster = new Spymaster(api, side);
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    let gamePage = new CodenamesGamePage(page, side);

    // Set screen size
    await page.setViewport({width: 1080, height: 1024});

    // Go to the codenames room
    await page.goto(`https://codenames.game/room/${roomCode}`);

    // Type into the nickname field and submit
    await gamePage.fillNickname(spymasterNickname);

    // Wait for the "Join as spymaster" button and click it
    await gamePage.joinAsSpymaster();

    while (true) {
        // Wait for round to start or game to end
        if(!await gamePage.waitForGiveCluePromptOrGameOver()) { break; }
        
        let cards = await gamePage.getCards(page);
        let [clueWord, clueNumber] = await spymaster.getClue(cards);      
        let clueGiven = false;
        while(!clueGiven) {
            try {
                await gamePage.giveClue(clueWord, clueNumber);
                clueGiven = true;
            } catch (err){}
        }
    }
    log(side, "Game over! Bye bye :)");

    await browser.close();
}
