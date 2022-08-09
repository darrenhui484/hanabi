import { v4 as uuidv4 } from 'uuid';


export class Card {
    color: Card.Color
    number: number
    id: string
    hintApplied: Card.HintApplied
    uiCount: number

    constructor(color: Card.Color, number: number, id = uuidv4(), uiCount = 1) {
        this.color = color;
        this.number = number;
        this.id = id;
        this.hintApplied = Card.HintApplied.None;
        this.uiCount = uiCount;
    }
}

export namespace Card {
    export enum Color {
        Red,
        Green,
        Yellow,
        Blue,
        White
    }

    export const Colors = [
        Card.Color.Red,
        Card.Color.Yellow,
        Card.Color.Blue,
        Card.Color.White,
        Card.Color.Green
    ];

    export enum HintApplied {
        None,
        Color,
        Number,
        ColorAndNumber
    }

}