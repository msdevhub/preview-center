import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from '@emotion/styled';
import { usePDFData } from "./usePdf";
import { Page } from "./Page";
import { keyframes } from '@emotion/react';
import { IoInformationCircle } from "react-icons/io5";

const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Sidebar = styled.div`
  position: fixed;
  height: 100vh;
  box-sizing: border-box;
  padding: 40px 0 20px;
  background: rgb(34, 38, 45);
  overflow-y: auto;
  left: 0;
  top: 50px;
  width: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease-in-out;

  @media (max-width: 600px) {
    transform: translateX(-100%);
    &.open {
      transform: translateX(0);
    }
  }
`;

const Preview = styled.div`
  width: 58vw;
  padding-left: 130px;
  overflow-y: auto;
  height: calc(100vh - 50px);

  @media (max-width: 600px) {
    width: 100vw;
    padding-left: 0;
  }
`;

const MenuButton = styled.button`
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: rgb(34, 38, 45);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  @media (min-width: 960px) {
    display: none;
  }
`;

const Image = styled.img`
  margin-top: 20px;
  width: 100px;
  border: 6px solid transparent;
  cursor: pointer;

  &.active {
    border-color: rgb(121, 162, 246);
  }
`;

const PageNumber = styled.span`
  background: transparent;
  font-size: 14px;
  margin-top: 4px;
  color: #fff;
`;

// 简单的菜单图标 SVG
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: #1976d2;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Spinner = styled.div`
  border: 4px solid #1976d2;
  border-top: 4px solid transparent;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 20px;
`;

const ErrorContainer = styled.div`
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

export const PDFRender: React.FC<{ src: string }> = (props) => {
  const { loading, error, urls, previewUrls } = usePDFData({
    src: props.src
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const io = useRef(new IntersectionObserver((entries) => {
    entries.forEach(item => {
      item.intersectionRatio >= 0.5 && setCurrentPage(Number(item.target.getAttribute('index')))
    })
  }, {
    threshold: [0.5]
  }))
  const goPage = (i: number) => {
    setCurrentPage(i)
    document.querySelectorAll('.page')[i]!.scrollIntoView({ behavior: 'smooth' })
  }
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingContent>
          <Spinner />
          正在加载...
        </LoadingContent>
      </LoadingContainer>
    )
  }

  if (error) {
    return (
      <ErrorContainer>
        <IoInformationCircle size={24} />
        <div>{error}</div>
      </ErrorContainer>
    )
  }

  return (
    <Box>
      <MenuButton onClick={toggleSidebar}>
        <MenuIcon />
      </MenuButton>
      <Sidebar className={sidebarOpen ? 'open' : ''}>
        {previewUrls?.map((item, i) => (
          <React.Fragment key={item}>
            <Image
              src={item}
              className={currentPage === i ? 'active' : ''}
              onClick={() => {
                goPage(i);
                setSidebarOpen(false); // 在移动端选择页面后关闭侧边栏
              }}
            />
            <PageNumber>{i + 1}</PageNumber>
          </React.Fragment>
        ))}
      </Sidebar>
      <Preview>
        {urls?.map((item, i) => (
          <Page index={i} io={io.current} src={item} key={item}/>
        ))}
      </Preview>
    </Box>
  )
}
