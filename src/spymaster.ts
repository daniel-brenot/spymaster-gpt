// This file contains the actual interactions with chatgpt

import { OpenAIApi } from "openai";
import { log } from "./logging";
import { CardStatus, Team } from "./types";

export class Spymaster {

    constructor(private api: OpenAIApi, private side: Team) {}

    async getClue(cards: CardStatus) {
        let prompt = this.getPromptForCards(cards);
        let response = await this.getResponseForPrompt(prompt);
        return this.getClueFromResponse(response);
    }

    getSystemPrompt() {
        const SYSTEM_MESSAGE = `You are the spymaster for the ${this.side} team in a game called Codenames.
Codenames is a game for two teams, a red team and a blue team.
One player from each team is the Spymaster, and only Spymasters see which words belong to which team.
As a spymaster you will need to provide clue words that are not on any of the cards that exist on the board.
Your clue should be only one word and describe cards for your team while avoiding cards that are the color of the other team or black.
The clue number says how many cards the clue that was given describes.
You will *always* respond with the format of "clue number".
Clue example: "MELODY 3".
`;
        return SYSTEM_MESSAGE;
    }

    /** Gets the prompt for chatgpt that will elicit the response needed to play the game */
    getPromptForCards(cards: CardStatus) {
        let redCardWords = cards.redCards.map(c=>`"${c}"`).join(", ");
        let blueCardWords = cards.blueCards.map(c=>`"${c}"`).join(", ");
        let grayCardWords = cards.grayCards.map(c=>`"${c}"`).join(", ");
        let blackCardWord = `"${cards.blackCard}"`;

        return `The red cards: ${redCardWords}
The blue cards: ${blueCardWords}
The gray cards: ${grayCardWords}
The black card: ${blackCardWord}
What clue do you have for your operatives?`
    }

    async getResponseForPrompt(message: string) {
        let response = await this.api.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: this.getSystemPrompt() },
                { role: "user", content: message}
            ]
        });
        let outMessage = response.data.choices[0].message?.content!;
        log(this.side, `Response: ${outMessage}`);
        return outMessage;
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
