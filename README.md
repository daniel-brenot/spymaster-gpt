# Spymaster GPT

This project is a naive attempt I threw together to create an automated spymaster for the game
codenames.

## Intended improvements

 - [ ] Configure spymasters names via CLI
 - [x] Configure room name via cli arg
 - [x] Make code more resilient to off timings
 - [ ] Prevent the AI from cheating
 - [ ] Create a GIF showing the guesses and hints over the course of the game
 - [x] Get requests to return consistently formatted clues


## Issues
The replies from ChatGPT are not very good. The numbers have nothing to do with the number of clues
that the hint applies to, so the hints are just bad. This could be fixed with a better
prompt, so getting this to a point where the spymaster gives good hints is relatively trivial now.

It will also hang sometimes while waiting to see if the next round or game over has triggered.
I'm not sure why yet, but I'm sure this can be fixed by adding a timeout and retrying manually
rather than relying on the mechanism offered by puppeteer.

If it hangs, feel free to close it and just rerun the program. It will rejoin the room as a new spymaster, but with the same spymaster name.

## Prerequisites
Have node.js installed and run `npm install` in this directory.
You also need to have an openai api key set to the environment variable `OPENAI_API_KEY`

## Setup
Go to the codenames site(https://codenames.game/) and create a new room.
Join and then copy the room name from the url (ex curious-fever-hound).
Paste the room name into the string for roomCode in the source code.

Run the command `npm run-script build` to create the spymasters that will now run for both sides.

Now you should be able to run `npm run-script run <room-name>` to spin up a spymaster for both sides.
