import styles from '../styles/Modal.module.scss';
import { motion } from 'framer-motion';

interface IModalProps {
    children: JSX.Element | null;
    isOpen: boolean;
}

export default function Modal({ children, isOpen }: IModalProps) {

    const variants = {
        visible: {
            display: 'inherit',
            opacity: 1
        },
        hidden: {
            opacity: 0,
            transitionEnd: {
                display: 'none',
            }
        }
    }

    //TODO figure out why modal transition doesnt disappear according to duration

    return (
        <motion.div
            animate={isOpen ? 'visible' : 'hidden'}
            variants={variants}
            transition={{ duration: 3 }}
            className={styles.main}>
            {children}
        </motion.div>
    )
}