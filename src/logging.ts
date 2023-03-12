import { Team } from "./types";

export function log(side: Team, message) {
    console.log(`[${side}] ${message}`)
}