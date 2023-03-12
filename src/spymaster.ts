// This file contains the actual interactions with chatgpt

import type { ChatGPTAPI } from "chatgpt";
import { log } from "./logging";
import { CardStatus, Team } from "./types";

export class Spymaster {

    constructor(private api: ChatGPTAPI, private side: Team) {}

    async getClue(cards: CardStatus) {
        let prompt = this.getPromptForCards(cards);
        let response = await this.getResponseForPrompt(prompt);
        return this.getClueFromResponse(response);
    }

    /** Gets the prompt for chatgpt that will elicit the response needed to play the game */
    getPromptForCards(cards: CardStatus) {
        let redCardWords = cards.redCards.map(c=>`"${c}"`).join(", ");
        let blueCardWords = cards.blueCards.map(c=>`"${c}"`).join(", ");
        let grayCardWords = cards.grayCards.map(c=>`"${c}"`).join(", ");
        let blackCardWord = `"${cards.blackCard}"`;

        return `You are the spymaster in a game called Codenames.
Codenames is a game for two teams.There is a list of 25 words.
Some of them are secretly assigned to the Red Team, some to the Blue Team.
One player from each team is the Spymaster, and only Spymasters see which words belong to which team.
Spymasters take turns giving clues to their teammates (Operatives), trying to lead them to guessing their team's words.
The team that guesses all their words first wins the game.
You are the spymaster for ${this.side} team and you are only allowed to respond one word at a time with the format of "word number" example:"MELODY 5".
Here's the state of the board:

The red cards: ${redCardWords} The blue cards: ${blueCardWords} The gray cards: ${grayCardWords} The black card: ${blackCardWord}

Its your turn now.
You don't need to explain the reasons of your choice just write the word followed by the number.
What word and number do you say?`
    }

    async getResponseForPrompt(message: string) {
        let response = (await this.api.sendMessage(message)).text;
        log(this.side, `Response: ${response}`);
        return response;
    }

    /** Extracts the clue word and number from the response text from chatgpt */
    getClueFromResponse(response: string): [string, number] {
        try {
            let clue = response.substring(response.indexOf(`"`)+1, response.indexOf(`"`, response.indexOf(`"`)+1));
            let [clueWord, clueNumber] = clue.split(" ");
            return [clueWord, parseInt(clueNumber)];
        } catch(err) {
            log(this.side, `ERROR Failed to parse ChatGPT response: ${response}`)
            throw err;
        }
        
    }
}
