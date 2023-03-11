# Spymaster GPT

This project is a naive attempt I threw together to create an automated spymaster for the game
codenames.

## Intended improvements

 - [ ] Configure spymasters names via CLI
 - [ ] Configure room name via cli arg
 - [ ] Make code more resilient to off timings
 - [ ] Prevent the AI from cheating
 - [ ] Create a GIF showing the guesses and hints over the course of the game
 - [ ] Get requests to return consistently formatted clues


## Issues
It is very difficult to get chatgpt to consistently reply in the same format, so getting
the clue word along with a hint is not simple.

A solution could be a better prompt that gets chatgpt to consistently format the answer the same way
every time, but I haven't found a prompt that will consistently work. If you do, please share!

Other than that yes, this will fail sometimes if the page doesn't respond quickly or if
animations don't load at the expected speed. I intend to improve this, but so far I have only spent
half a day on this project, so this is where it's at.

## Prerequisites
Have node.js installed and run `npm install` in this directory.
You also need to have an openai api key set to the environment variable ``

## Setup
Go to the codenames site(https://codenames.game/) and create a new room.
Join and then copy the room name from the url (ex curious-fever-hound).
Paste the room name into the string for roomCode in the source code.

Run the command `npm run-script build` to create the spymasters that will now run for both sides.

Now you should be able to run `npm run-script run` to spin up a spymaster for both sides.
