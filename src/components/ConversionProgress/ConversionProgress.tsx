import styles from './ConversionProgress.module.css';

type ConversionProgressProps = {
  status: 'parsing' | 'converting';
}

export function ConversionProgress({ status }: ConversionProgressProps) {
  return (
    <div className={styles.row}>
      <div className={styles.spinnerWrap}>
        <div className={styles.spinnerRing} />
        <div className={styles.spinnerDot} />
      </div>
      <span className={styles.label}>
        {status === 'parsing' ? 'Reading email…' : 'Converting to PDF…'}
      </span>
    </div>
  );
}
