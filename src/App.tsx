import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from './components/ErrorBoundary';
import { PDFRender } from './components/PDFRender';
import FilePDF from './components/FIlePDF';
import { ReactPDF } from './components/ReactPDF'; 
import PDFViewer from './components/PDFViewer';
import { ImageViewer } from './components/ImageViewer';

interface Props {
  fileUrl: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 8px;
  max-width: 1200px;
  margin: 0 auto;
`;

const InputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
  
  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: #1565c0;
  }
  
  @media (max-width: 768px) {
    width: auto;
    min-width: 80px;
  }
`;

const PDFContainer = styled.div`
  flex: 1;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid #eee;
  
  @media (max-width: 768px) {
    border-radius: 0;
  }
`;

const Toggle = styled.select`
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    width: 100%;
  }
`;

// 修改文件类型定义
type ImageType = 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
type FileType = 'pdf' | ImageType;
type RenderMethod = 'PDFRender' | 'FilePDF' | 'ReactPDF' | 'PDFViewer' | 'Image';

const defaultPdfFilePath = 'https://s28.q4cdn.com/392171258/files/doc_downloads/test.pdf';

export const App = () => {
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  const [fileUrl, setFileUrl] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get('url');
    const defaultValue = urlParam || localStorage.getItem('lastFileUrl') || defaultPdfFilePath;
    setCurrentFileUrl(decodeURIComponent(defaultValue));
    return defaultValue;
  });
  
  const [fileType, setFileType] = useState<FileType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type')?.toLowerCase() as FileType;
    // 检查是否为支持的文件类型
    if (['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(typeParam)) {
      return typeParam;
    }
    // 如果没有指定类型或类型不支持，尝试从URL推断类型
    const urlParam = urlParams.get('url');
    if (urlParam) {
      const extension = urlParam.split('.').pop()?.toLowerCase();
      if (['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) {
        return extension as FileType;
      }
    }
    return 'pdf';
  });
  
  const [renderMethod, setRenderMethod] = useState<RenderMethod>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type')?.toLowerCase();
    // 如果是图片类型，直接返回 Image
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(typeParam || '')) {
      return 'Image';
    }
    return 'ReactPDF';
  });

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileUrl(event.target.value);
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFileType(event.target.value as FileType);
  };

  const handleViewFile = () => {
    setCurrentFileUrl(fileUrl);
    localStorage.setItem('lastFileUrl', fileUrl);
  };

  const handleRenderMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRenderMethod(event.target.value as RenderMethod);
  };

  const renderContent = () => {
    switch (renderMethod) {
      case 'PDFRender':
        return <PDFRender src={currentFileUrl} />;
      case 'FilePDF':
        return <FilePDF fileUrl={currentFileUrl} />;
      case 'PDFViewer':
        return <PDFViewer fileUrl={currentFileUrl} />;
      case 'Image':
        return <ImageViewer src={currentFileUrl} />;
      default:
        return <ReactPDF fileUrl={currentFileUrl} />;
    }
  };

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Container>
        <InputContainer>
          <Input type="text" value={fileUrl} onChange={handleUrlChange} placeholder="输入文件地址" />
          <ActionContainer>
            <Toggle value={renderMethod} onChange={handleRenderMethodChange}>
              <option value="Image">图片</option>
              <option value="PDFRender">PDFRender</option>
              <option value="FilePDF">FilePDF</option>
              <option value="ReactPDF">ReactPDF</option>
              <option value="PDFViewer">PDFViewer</option>
            </Toggle>
            <Button onClick={handleViewFile}>查看</Button>
          </ActionContainer>
        </InputContainer>
        <PDFContainer>
          {renderContent()}
        </PDFContainer>
      </Container>
    </ErrorBoundary>
  );
};
