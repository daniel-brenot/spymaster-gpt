import { ChatGPTAPI } from 'chatgpt';
import puppeteer, { Page } from 'puppeteer';

const OPENAI_KEY = process.env["OPENAI_API_KEY"] as string;

type CardStatus = Awaited<ReturnType<typeof getCards>>;

const NICKNAME_INPUT_SELECTOR = "#nickname-input";
const NICKNAME_SUBMIT_SELECTOR = ".jsx-2506078312";

const BLUE_JOIN_AS_SPYMASTER_SELECTOR = "xpath///main[@id='teamBoard-blue']//button[contains(., 'Join as Spymaster')]";
const RED_JOIN_AS_SPYMASTER_SELECTOR = "xpath///main[@id='teamBoard-red']//button[contains(., 'Join as Spymaster')]";

const GIVE_OPPERATIVES_CLUE_TEXT_SELECTOR = "xpath///span[contains(., 'Give your operatives a clue.')]";

const RED_CARD_SELECTOR = ".card.red.text-black section div";
const BLUE_CARD_SELECTOR = ".card.blue.text-black section div";
const BLACK_CARD_SELECTOR = ".card.black.text-white section div";
const NEUTRAL_CARD_SELECTOR = ".card.gray.text-black section div"

const CLUE_TEXT_INPUT_SELECTOR = "xpath///input[@name='clue']";
const CLUE_NUM_SELECT_BUTTON_SELECTOR = ".numSelect-wrapper";
const GIVE_CLUE_BUTTON_SELECTOR = "xpath///button[contains(., 'Give Clue')]";



(()=>{
    let roomCode = "razor-bay-shot";
    spymaster(roomCode, "not-a-robot-red", "red");
    spymaster(roomCode, "not-a-robot-blue", "blue");
})();


async function spymaster(roomCode: string, spymasterNickname: string, side: "red" | "blue") {
    const api = new ChatGPTAPI({
        apiKey: OPENAI_KEY
    });
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    // Set screen size
    await page.setViewport({width: 1080, height: 1024});

    // Go to the codenames room
    await page.goto(`https://codenames.game/room/${roomCode}`);

    // Wait for the page to load
    // await new Promise((res) => setTimeout(res, 3000));

    // Type into the nickname field and submit
    await page.waitForSelector(NICKNAME_INPUT_SELECTOR);
    await page.type(NICKNAME_INPUT_SELECTOR, spymasterNickname);
    await page.click(NICKNAME_SUBMIT_SELECTOR);

    // Wait for the "Join as spymaster" button and click it
    console.log("Waiting for join as spymaster");
    if(side == "red") {
        await page.waitForSelector(RED_JOIN_AS_SPYMASTER_SELECTOR);
    } else {
        await page.waitForSelector(BLUE_JOIN_AS_SPYMASTER_SELECTOR);
    }
    console.log("Found join as spymaster");

    if(side == "red") {
        await page.click(RED_JOIN_AS_SPYMASTER_SELECTOR);
    } else {
        await page.click(BLUE_JOIN_AS_SPYMASTER_SELECTOR);
    }

    // Wait for game to start
    console.log("Waiting for game to start...");
    await page.waitForSelector(GIVE_OPPERATIVES_CLUE_TEXT_SELECTOR, { timeout: 0 });
    console.log("Game started.");

    while (true) {
        let cards = await getCards(page);
        let prompt = await getPromptForCards(cards, side);
        let clueWord: string;
        let clueNumber: number;
        do {
            let response = (await api.sendMessage(prompt)).text;
            console.log(`${side} got response: ${response}`);
            [clueWord, clueNumber] = getClueFromResponse(response);
        } while (!clueWord || Number.isNaN(clueNumber));
        
        // Sometimes the request is so fast it completes before the animation does!
        await page.waitForSelector(CLUE_TEXT_INPUT_SELECTOR);
        // Type in the clue
        await page.type(CLUE_TEXT_INPUT_SELECTOR, clueWord);
        // Click the button to open the number popup
        await page.click(CLUE_NUM_SELECT_BUTTON_SELECTOR);
        // Click the popup button corresponding to the clue number
        await page.click(getSelectorForNumber(clueNumber));
        // Click give clue button
        await page.click(GIVE_CLUE_BUTTON_SELECTOR);
        // Finally, wait until the prompt to give annother clue shows
        await page.waitForSelector(GIVE_OPPERATIVES_CLUE_TEXT_SELECTOR, { timeout: 0 });
    }

    await browser.close();
}

/** Gets the cards that are currently on the screen as text arrays */
async function getCards(page: Page) {
    let redCards = await page.$$eval(RED_CARD_SELECTOR, e=>e.map(n=>n.innerText));
    let blueCards = await page.$$eval(BLUE_CARD_SELECTOR, e=>e.map(n=>n.innerText));
    let neutralCards = await page.$$eval(NEUTRAL_CARD_SELECTOR, e=>e.map(n=>n.innerText));
    let blackCard = (await page.$$eval(BLACK_CARD_SELECTOR, e=>e.map(n=>n.innerText)))[0];

    return {
        redCards,
        blueCards,
        neutralCards,
        blackCard
    }
}

/** Gets the prompt for chatgpt that will elicit the response needed to play the game */
async function getPromptForCards(cards: CardStatus, side: "blue" | "red") {
    let redCardWords = cards.redCards.map(c=>`"${c}"`).join(", ");
    let blueCardWords = cards.blueCards.map(c=>`"${c}"`).join(", ");
    let grayCardWords = cards.neutralCards.map(c=>`"${c}"`).join(", ");
    let blackCardWord = `"${cards.blackCard}"`;

    return `You are the spymaster for ${side} team in a game of codenames, and you are only allowed to speak in the format of "MELODY 5"..
    The red cards on the board have the words ${redCardWords}.
    The blue cards on the board have the words ${blueCardWords}.
    The gray cards on the board have the words ${grayCardWords}.
    The black card on the board has the word ${blackCardWord}.
    What word and number do you say?`

}

/** Extracts the clue word and number from the response text from chatgpt */
function getClueFromResponse(response: string): [string, number] {
    let clue = response.substring(response.indexOf(`"`)+1, response.indexOf(`"`, response.indexOf(`"`)+1));
    let [clueWord, clueNumber] = clue.split(" ");
    return [clueWord, parseInt(clueNumber)];
}

/** Gets the xpath selector for the button in the popup representing the clue number option */
function getSelectorForNumber(num: number) {
    return `xpath///div[contains(., '${num}') and contains(@class, 'option')]`;
}