import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import ErrorBoundary from './components/ErrorBoundary';
import { PDFRender } from './components/PDFRender';
import FilePDF from './components/FIlePDF';
import { ReactPDF } from './components/ReactPDF'; 
import PDFViewer from './components/PDFViewer';
import { ImageViewer } from './components/ImageViewer';
import { IoInformationCircle } from "react-icons/io5";

// 类型定义
type SupportedImageType = 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
type FileType = 'pdf' | SupportedImageType | 'unsupported';
type ViewerType = 'PDFRender' | 'FilePDF' | 'ReactPDF' | 'PDFViewer' | 'Image' | 'unsupported';

const SUPPORTED_FILE_TYPES = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] as const;
const DEFAULT_PDF_URL = 'https://www.swccd.edu/student-support/disability-support-services-dss/_files/dss_sign_pdf.pdf';
const CLICK_THRESHOLD = 10;
const CLICK_TIMEOUT = 10000;
const CLICK_AREA_SIZE = 100;
const CLICK_TIME_WINDOW = 5000;

// 样式组件
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
`;

const Button = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #1565c0;
  }
`;

const ViewerContainer = styled.div`
  flex: 1;
  overflow: hidden;
  height: 100vh;
  /* border-radius: 0.5rem;
  border: 1px solid #eee; */
`;

const ViewerSelect = styled.select`
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const ActionContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const UnsupportedTypeMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(46, 46, 46, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ClickArea = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  width: ${CLICK_AREA_SIZE}px;
  height: ${CLICK_AREA_SIZE}px;
  z-index: 1000;
`;


export const App = () => {
  // 状态管理
  const [currentFileUrl, setCurrentFileUrl] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get('url');
    return decodeURIComponent(urlParam || localStorage.getItem('lastFileUrl') || DEFAULT_PDF_URL);
  });
  
  const [fileUrl, setFileUrl] = useState(currentFileUrl);
  
  const [fileType, setFileType] = useState<FileType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type')?.toLowerCase();
    
    // 优先使用 URL 中的 type 参数
    if (typeParam && SUPPORTED_FILE_TYPES.includes(typeParam as any)) {
      return typeParam as FileType;
    }
    
    // 如果没有 type 参数，则从文件扩展名判断
    const extension = currentFileUrl.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_FILE_TYPES.includes(extension as any) 
      ? (extension as FileType) 
      : 'unsupported';
  });
  
  const [viewerType, setViewerType] = useState<ViewerType>(() => {
    if (fileType === 'unsupported') {
      return 'unsupported';
    }
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileType) ? 'Image' : 'PDFRender';
  });

  const [isInputVisible, setInputVisible] = useState(false);
  const [clicks, setClicks] = useState<{ timestamp: number }[]>([]);

  // 处理函数
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileUrl(event.target.value);
  };

  const handleViewFile = () => {
    setCurrentFileUrl(fileUrl);
    localStorage.setItem('lastFileUrl', fileUrl);
    
    const extension = fileUrl.split('.').pop()?.toLowerCase() || '';
    if (SUPPORTED_FILE_TYPES.includes(extension as any)) {
      setFileType(extension as FileType);
      setViewerType(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension) ? 'Image' : 'PDFRender');
    } else {
      setFileType('unsupported');
    }
  };

  const handleViewerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setViewerType(event.target.value as ViewerType);
  };

  const handleAreaClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    const currentTime = Date.now();
    
    setClicks(prevClicks => {
      const recentClicks = [
        ...prevClicks.filter(click => currentTime - click.timestamp < CLICK_TIME_WINDOW),
        { timestamp: currentTime }
      ];

      if (recentClicks.length >= CLICK_THRESHOLD) {
        setInputVisible(true);
        return [];
      }

      return recentClicks;
    });
  };

  // 渲染内容
  const renderViewer = () => {
    if (fileType === 'unsupported') {
      return (
        <UnsupportedTypeMessage>
          <IoInformationCircle size={24} />
          暂不支持此类型的内容
        </UnsupportedTypeMessage>
      );
    }

    const viewers = {
      PDFRender: <PDFRender src={currentFileUrl} />,
      Image: <ImageViewer src={currentFileUrl} />
    };

    return viewers[viewerType as keyof typeof viewers];
  };

  return (
    <ErrorBoundary>
      <Container>
        {isInputVisible && (
          <InputContainer>
            <Input 
              type="text" 
              value={fileUrl} 
              onChange={handleUrlChange} 
              placeholder="输入文件地址" 
            />
            <ActionContainer>
              <ViewerSelect value={viewerType} onChange={handleViewerChange}>
                <option value="Image">图片</option>
                <option value="PDFRender">PDFRender</option>
              </ViewerSelect>
              <Button onClick={handleViewFile}>查看</Button>
            </ActionContainer>
          </InputContainer>
        )}
        <ViewerContainer>
          {renderViewer()}
        </ViewerContainer>
        <ClickArea onClick={handleAreaClick} />
      </Container>
    </ErrorBoundary>
  );
};
