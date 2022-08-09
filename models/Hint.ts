import { Card } from "./Card";

export class Hint {
    type: Hint.HintType;
    value: Card.Color | number;
    targetPlayerId: string;

    constructor(type: Hint.HintType, value: Card.Color | number, targetPlayerId: string) {
        this.type = type;
        this.value = value;
        this.targetPlayerId = targetPlayerId;
    }
}

export namespace Hint {
    export enum HintType {
        Number,
        Color
    }
}