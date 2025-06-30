import React from 'react';
import { NumericFormat } from 'react-number-format';
import { TextField } from '@mui/material';

interface Props {
  label: string;
  value: number | string | null;
  onChange: (value: number | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const NumericInput: React.FC<Props> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
}) => {
  return (
    <NumericFormat
      customInput={TextField}
      label={label}
      value={value != null ? value : ''}
      thousandSeparator='.'
      decimalSeparator=','
      decimalScale={2}
      allowNegative={false}
      type='text'
      fullWidth
      size='small'
      disabled={disabled}
      onValueChange={(values) => {
        onChange(values.floatValue ?? null);
      }}
      error={error}
      helperText={helperText}
    />
  );
};

export default NumericInput;
