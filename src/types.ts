import { CodenamesGamePage } from "./page-interactions";

export type Team = "red" | "blue";

// This type should make you sad
export type CardStatus = Awaited<ReturnType<InstanceType<typeof CodenamesGamePage>["getCards"]>>;
