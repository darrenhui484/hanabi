import styles from '../styles/Modal.module.scss';
import { motion } from 'framer-motion';

interface IModalProps {
    children: JSX.Element | null;
    isOpen: boolean;
}

export default function Modal({ children, isOpen }: IModalProps) {

    const variants = {
        visible: {
            display: 'block',
            opacity: 1
        },
        hidden: {
            opacity: 0,
            transitionEnd: {
                display: 'none',
            }
        }
    }

    return (
        <motion.div
            animate={isOpen ? 'visible' : 'hidden'}
            variants={variants}
            transition={{ duration: 0.1 }}
            className={styles.main}>
            {children}
        </motion.div>
    )
}