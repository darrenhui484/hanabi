import styles from '../styles/HintCountItem.module.scss';

export default function HintCountItem() {

    return (
        <>
            <svg className={styles.main} width="25" height="25" viewBox="0 0 715 830" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 28V802M687 28V802M29 802H685M29 28H685" stroke="#6e6e6e" strokeWidth="56" strokeLinecap="round" />
                <path d="M226 289H329M226 162V284M228 162H488M488 173V403M359 403H487M358 404V570" stroke="#6e6e6e" strokeWidth="56" strokeLinecap="round" />
                <ellipse cx="358.5" cy="680" rx="36.5" ry="42" fill="#6e6e6e" />
            </svg>
        </>

    )

}