import { motion, Variants } from 'framer-motion'
import styles from '../styles/EllipsisItem.module.scss';

export default function EllipsisItem() {

    const parentVariant: Variants = {
        isActive: {
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2,
                ease: 'easeInOut'
            }
        },
    }

    const childVariant: Variants = {
        isActive: {
            y: [10, 0],
            opacity: [1, .2],
            transition: {
                duration: 0.8,
                yoyo: Infinity
            }
        }
    }

    return (
        <motion.div
            animate={'isActive'}
            variants={parentVariant}
            className={styles.container}
        >
            <motion.div className={styles.dot} variants={childVariant} />
            <motion.div className={styles.dot} variants={childVariant} />
            <motion.div className={styles.dot} variants={childVariant} />
        </motion.div>
    );
}