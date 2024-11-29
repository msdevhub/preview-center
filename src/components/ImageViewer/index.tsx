import React, { useState } from 'react';
import styled from '@emotion/styled';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

interface Props {
  src: string;
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
  width: auto;
  height: auto;
`;

const Controls = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px;
  border-radius: 20px;
  z-index: 1000;
`;

const ControlButton = styled.button`
  background: transparent;
  border: 1px solid white;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: #666;
  background: #f5f5f5;
`;

export const ImageViewer: React.FC<Props> = ({ src }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleImageLoad = (resetTransform: () => void) => {
    setIsLoading(prev => {
      setTimeout(() => {
        resetTransform();
      }, 50);

      return false;
    });
    setError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (error) {
    return <LoadingContainer>图片加载失败</LoadingContainer>;
  }

  return (
    <Container>
      <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit wheel={{ wheelDisabled: true }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent 
              wrapperStyle={{ 
                height: '100%', 
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              contentStyle={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%'
              }}
            >
              {isLoading && <LoadingContainer>加载中...</LoadingContainer>}
              <Image
                src={src}
                alt="预览图片"
                onLoad={() => {
                  handleImageLoad(resetTransform);
                }}
                onError={() => handleImageError()}
                style={{ 
                  display: isLoading ? 'none' : 'block',
                  margin: 'auto'
                }}
              />
            </TransformComponent>
            <Controls>
              <ControlButton onClick={() => zoomOut()}>-</ControlButton>
              <ControlButton onClick={() => resetTransform()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 4v7h7M20 20v-7h-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M20.49 9A9 9 0 0 0 5.64 5.64M18.36 18.36A9 9 0 0 1 3.51 15"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ControlButton>
              <ControlButton onClick={() => zoomIn()}>+</ControlButton>
            </Controls>
          </>
        )}
      </TransformWrapper>
    </Container>
  );
};
