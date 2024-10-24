import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from './components/ErrorBoundary';
import { PDFRender } from './components/PDFRender';
import FilePDF from './components/FIlePDF';

interface Props {
  fileUrl: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 10px;
`;

const InputContainer = styled.div`
  display: flex;
  margin-bottom: 5px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #1565c0;
  }
`;

const PDFContainer = styled.div`
  flex: 1;
  overflow: hidden;
  border-radius: 0.5rem;
`;

const Toggle = styled.select`
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
`;

const defaultPdfFilePath = 'https://s28.q4cdn.com/392171258/files/doc_downloads/test.pdf';

export const App = () => {
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState(() => {
    // 首先尝试从URL参数中获取PDF地址
    const urlParams = new URLSearchParams(window.location.search);
    const pdfParam = urlParams.get('pdf');
    
    // 如果URL参数中有PDF地址,则使用它
    // 否则,从localStorage获取缓存的URL,如果没有则使用默认地址
    const defaultValue = pdfParam || localStorage.getItem('lastPdfUrl') || defaultPdfFilePath;
    setCurrentPdfUrl(defaultValue);
    return defaultValue;
  });
  const [renderMethod, setRenderMethod] = useState<'PDFRender' | 'FilePDF'>('PDFRender');

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUrl(event.target.value);
  };

  const handleViewPdf = () => {
    setCurrentPdfUrl(pdfUrl);
    // 将当前URL保存到localStorage
    localStorage.setItem('lastPdfUrl', pdfUrl);
  };

  const handleRenderMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRenderMethod(event.target.value as 'PDFRender' | 'FilePDF');
  };
 

  return (
    <ErrorBoundary>
      <Container>
        <InputContainer>
          <Input type="text" value={pdfUrl} onChange={handleUrlChange} placeholder="输入 PDF 文件地址" />
          <Toggle value={renderMethod} onChange={handleRenderMethodChange}>
            <option value="PDFRender">PDFRender</option>
            <option value="FilePDF">FilePDF</option>
          </Toggle>
          <Button onClick={handleViewPdf}>查看</Button>
        </InputContainer>
        <PDFContainer>
          {renderMethod === 'PDFRender' ? <PDFRender src={currentPdfUrl} /> : <FilePDF fileUrl={currentPdfUrl} />}
        </PDFContainer>
      </Container>
    </ErrorBoundary>
  );
};
