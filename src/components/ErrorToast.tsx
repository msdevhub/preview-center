import React from 'react';
import { styled } from '@mui/styles';

interface ErrorToastProps {
  error: Error;
  onClose: () => void;
}

const ToastContainer = styled('div')({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: '#f44336',
  color: 'white',
  padding: '15px 25px',
  borderRadius: '4px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  zIndex: 1000,
  maxWidth: '80%',
  wordBreak: 'break-word',
});

const CloseButton = styled('button')({
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  float: 'right',
  fontSize: '20px',
  marginLeft: '15px',
  fontWeight: 'bold',
});

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  return (
    <ToastContainer>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <strong>错误:</strong> {error.message}
      <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
        <strong>堆栈跟踪:</strong> {error.stack}
      </div>
    </ToastContainer>
  );
};

export default ErrorToast;
