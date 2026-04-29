import { CheckIcon } from '../CheckIcon/CheckIcon'
import styles from './StepItem.module.css'

export type StepState = 'done' | 'active' | 'pending'

interface StepItemProps {
  label: string
  state: StepState
}

export function StepItem({ label, state }: StepItemProps) {
  return (
    <div className={`${styles.step} ${styles[`step_${state}`]}`}>
      <div className={styles.stepDot}>
        {state === 'done' && <CheckIcon />}
      </div>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  )
}
