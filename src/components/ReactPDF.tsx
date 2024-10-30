import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import styled from '@emotion/styled';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  width: 100%;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
  align-items: center;
  width: 100%;
  max-width: 100vw;
`;

const PageWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .react-pdf__Page {
    max-width: 100% !important;
    width: auto !important;
    
    canvas {
      max-width: 100% !important;
      height: auto !important;
    }
  }
`;

const PageNumber = styled.div`
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  z-index: 1;
`;

interface Props {
  fileUrl: string;
}

export const ReactPDF: React.FC<Props> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  
  useEffect(() => {
    const updateScale = () => {
      // 获取视窗宽度
      const width = window.innerWidth;
      if (width <= 768) {  // 移动设备
        setScale(width / 1000);  // 1000是一个参考值，可以根据需要调整
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <Container>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div>加载中...</div>}
      >
        <PageContainer>
          {Array.from(new Array(numPages), (_, index) => (
            <PageWrapper key={`page_${index + 1}`}>
              <PageNumber>第 {index + 1} 页 / 共 {numPages} 页</PageNumber>
              <Page 
                pageNumber={index + 1}
                loading={<div>页面加载中...</div>}
                scale={scale}
              />
            </PageWrapper>
          ))}
        </PageContainer>
      </Document>
    </Container>
  );
};
