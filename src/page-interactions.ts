// This file contains functions to interact with the webpage

import { Page } from "puppeteer";
import { log } from "./logging";
import { Team } from "./types";

const NICKNAME_INPUT_SELECTOR = "#nickname-input";
const NICKNAME_SUBMIT_SELECTOR = ".jsx-2506078312";

const BLUE_JOIN_AS_SPYMASTER_SELECTOR = "xpath///main[@id='teamBoard-blue']//button[contains(., 'Join as Spymaster')]";
const RED_JOIN_AS_SPYMASTER_SELECTOR = "xpath///main[@id='teamBoard-red']//button[contains(., 'Join as Spymaster')]";

const RED_CARD_SELECTOR = ".card.red.text-black section div";
const BLUE_CARD_SELECTOR = ".card.blue.text-black section div";
const BLACK_CARD_SELECTOR = ".card.black.text-white section div";
const GRAY_CARD_SELECTOR = ".card.gray.text-black section div"

const CLUE_TEXT_INPUT_SELECTOR = "xpath///input[@name='clue']";
const CLUE_NUM_SELECT_BUTTON_SELECTOR = ".numSelect-wrapper";
const GIVE_CLUE_BUTTON_SELECTOR = "xpath///button[contains(., 'Give Clue')]";

const GIVE_OPPERATIVES_CLUE_TEXT_SELECTOR = "xpath///span[contains(., 'Give your operatives a clue.')]";
const GAME_OVER_TEXT_SELECTOR = "xpath///span[contains(., 'team wins!')]";
const COMBINED_CLUE_AND_GAME_OVER_SELECTOR = "xpath///span[contains(., 'Give your operatives a clue.') or contains(., 'team wins!')]"

const GUESSING_SELECTOR = "xpath///span[contains(., 'Your operatives are guessing now...')]"

const HINTS_AND_PICKED_CARDS_SELECTOR = "em";

/** Just waits non-blocking for the period of time in a promise */
function sleep(ms: number): Promise<void> {
    return new Promise(res=>setTimeout(res, ms));
}

export class CodenamesGamePage {

    constructor(private page: Page, private side: Team) {}

    /** Gets the xpath selector for the button in the popup representing the clue number option */
    getSelectorForNumber(num: number) {
        return `xpath///div[contains(., '${num}') and contains(@class, 'option')]`;
    }

    /** Gets the selector for the 'Join as Spymaster' button for the team */
    get joinAsSpymasterSelector() {
        switch (this.side) {
            case "red": return RED_JOIN_AS_SPYMASTER_SELECTOR;
            case "blue": return BLUE_JOIN_AS_SPYMASTER_SELECTOR;
        }
    }

    /** If the correct screen is open, fills the username field and submits it */
    async fillNickname(nickname: string) {
        log(this.side, "Filling in nickname");
        try {
            await this.page.waitForSelector(NICKNAME_INPUT_SELECTOR);
            await this.page.type(NICKNAME_INPUT_SELECTOR, nickname);
            await this.page.click(NICKNAME_SUBMIT_SELECTOR);
        } catch (err) {
            log(this.side, "ERROR thrown filling in nickname")
            throw err;
        }
        log(this.side, "Nickname filled and submitted")
    }

    /** Joins the game as the spymaster for the given team */
    async joinAsSpymaster() {
        try {
            // First wait until the button shows on the page
            log(this.side, "Waiting for 'Join as Spymaster' button");
            await this.page.waitForSelector(this.joinAsSpymasterSelector, {timeout: 0});
            log(this.side, "Found 'Join as Spymaster' button. Clicking...");
            await this.page.click(this.joinAsSpymasterSelector);
            log(this.side, "Clicked 'Join as Spymaster' button");
            
            // Now sometimes we get a peculiar situation where the button is not pressed
            // even after this point, so we're just going to do a little check to make sure
            // the button is actually pressed
            let buttonStillFound = true;
            do {
                await sleep(2000);
                try {
                    // We actually want these to fail, so hopefully they do
                    await this.page.click(this.joinAsSpymasterSelector);
                    log(this.side, "WARNING Found 'Join as Spymaster' button after it was clicked. Clicked again.");
                } catch {
                    buttonStillFound = false;
                }
            } while(buttonStillFound);
        } catch (err) {
            log(this.side, "ERROR thrown while trying to join as spymaster");
            throw err;
        }
    }

    /** Waits until "Give your opperatives a clue" shows or game over shows*/
    async waitForGiveCluePromptOrGameOver() {
        try {
            log(this.side, "Waiting for round to start or game to end...");
            await this.page.waitForSelector(COMBINED_CLUE_AND_GAME_OVER_SELECTOR, { timeout: 0 });
            if(await this.page.$(GAME_OVER_TEXT_SELECTOR)) { return false; }
            log(this.side, "Round started.");
            return true;
        } catch (err) {
            log(this.side, "ERROR waiting for give clue prompt.");
            throw err; 
        }
    }

    async giveClue(clue: string, clueNum: number) {
        try {
            // Sometimes the request is so fast it completes before the animation does!
            log(this.side, "Waiting for clue text input...");
            await this.page.waitForSelector(CLUE_TEXT_INPUT_SELECTOR);
            // Type in the clue
            log(this.side, "Clue text input found. Typing clue...");
            await this.page.type(CLUE_TEXT_INPUT_SELECTOR, clue);
            // Click the button to open the number popup
            log(this.side, "Clue typed. Opening popup for clue");
            await this.page.click(CLUE_NUM_SELECT_BUTTON_SELECTOR);
            // Click the popup button corresponding to the clue number
            log(this.side, "Clue number popup opened. Selecting number of cards clue applies to...");
            await this.page.click(this.getSelectorForNumber(clueNum));
            // Click give clue button
            log(this.side, "Clicking to give clue...");
            await this.page.click(GIVE_CLUE_BUTTON_SELECTOR);
            let buttonStillFound = true;
            do {
                await sleep(2000);
                try {
                    // We actually want these to fail, so hopefully they do
                    await this.page.click(GIVE_CLUE_BUTTON_SELECTOR);
                    log(this.side, "WARNING Found 'Give Clue' button after it was clicked. Clicked again.");
                } catch {
                    buttonStillFound = false;
                }
            } while(buttonStillFound);
            log(this.side, "Clue given. Waiting to see operatives guessing...");
            await this.page.waitForSelector(GUESSING_SELECTOR);
            log(this.side, "Found operatives guessing text.");

        } catch(err) {
            log(this.side, "ERROR giving clue.")
            throw err;
        }
    }

    /** Gets the cards that are currently on the screen as text arrays */
    async getCards(page: Page) {
        try {
            // Wait for the cards to appear on the screen before continuing
            await page.waitForSelector(RED_CARD_SELECTOR);
            sleep(2000);
            // Get all of the cards on the page and their contents
            let redCards = await page.$$eval(RED_CARD_SELECTOR, e=>e.map(n=>n.innerText));
            let blueCards = await page.$$eval(BLUE_CARD_SELECTOR, e=>e.map(n=>n.innerText));
            let grayCards = await page.$$eval(GRAY_CARD_SELECTOR, e=>e.map(n=>n.innerText));
            let blackCard = (await page.$$eval(BLACK_CARD_SELECTOR, e=>e.map(n=>n.innerText)))[0];

            // Now get all of the card words from the game log
            let chosenCards = await page.$$eval(HINTS_AND_PICKED_CARDS_SELECTOR, e=>e.map(n=>n.innerText));
            // console.log(chosenCards)
            // Filter out any entries with a space, as they are clues
            chosenCards = chosenCards.filter(e=>!/[0-9]/.test(e));
            // Next, use chosen cards to filter out all of the other cards
            redCards = redCards.filter(a=>!chosenCards.includes(a));
            blueCards = blueCards.filter(a=>!chosenCards.includes(a));
            grayCards = grayCards.filter(a=>!chosenCards.includes(a));

            log(this.side, `Got cards from page. Red: ${redCards.length}, Blue: ${blueCards.length}, Gray: ${grayCards.length}`);

            return {
                redCards,
                blueCards,
                grayCards,
                blackCard
            }
        } catch(err) {
            log(this.side, "ERROR Failed to get information from cards on page");
            throw err;
        }
        
    }

}