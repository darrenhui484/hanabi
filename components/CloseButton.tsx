interface ICloseButtonProps {
    onCloseClick: () => void;
}

export default function CloseButton({ onCloseClick }: ICloseButtonProps) {
    return <button onClick={event => onCloseClick()}>X</button>
}