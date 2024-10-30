import { useEffect, useRef, useState, useCallback, TouchEvent } from 'react';
import * as PDFJS from 'pdfjs-dist';
import * as PDFViewer from 'pdfjs-dist/web/pdf_viewer';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

PDFJS.GlobalWorkerOptions.workerSrc = '/pdfjs-legacy/build/pdf.worker.js';
const CMAP_URL = '/pdfjs-legacy/web/cmaps';
interface PDFViewerProps {
  getTitle?: (title: string) => void;
  getPageNumber?: (page: number, numPages: number) => void;
  fileUrl: string;
}

interface PDFViewerState {
  USE_ONLY_CSS_ZOOM: boolean;
  TEXT_LAYER_MODE: number;
  MAX_IMAGE_SIZE: number;
  CMAP_URL: string;
  CMAP_PACKED: boolean;
  DEFAULT_URL: string;
  DEFAULT_SCALE_DELTA: number;
  MIN_SCALE: number;
  MAX_SCALE: number;
  DEFAULT_SCALE_VALUE: string;
  toPageNumber: string;
  preDisabled: boolean;
  nextDisabled: boolean;
  errorWrapperHide: boolean;
  errorMoreInfoHide: boolean;
  title: string;
  url: string;
  errorMessage: string;
  errorMoreInfo: string;
}

// 扩展 PDFViewer 接口
interface ExtendedPDFLinkService extends PDFViewer.PDFLinkService {
  isInPresentationMode: boolean;
  executeSetOCGState: (action: any) => void;
}

interface IL10n {
  getLanguage(): string;
  getDirection(): string;
  get(key: string, args?: any, fallback?: string): Promise<string>;
  translate(element: HTMLElement): Promise<void>;
}

interface ExtendedL10n extends IL10n {
  pause: () => void;
  resume: () => void;
}

// 创建简单的 L10n 实现
const createSimpleL10n = (): any => ({
  getLanguage: () => 'en-US',
  getDirection: () => 'ltr',
  get: (_key: string, _args: any, fallback: string) => Promise.resolve(fallback),
  translate: () => Promise.resolve(),
  pause: () => {},
  resume: () => {}
});

// 定义动画
const glimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// 样式组件
const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`;

const ViewerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 50px;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;

  scroll-behavior: smooth;

  -webkit-overflow-scrolling: touch;

  touch-action: none;

  @media (max-width: 768px) {
    padding: 0;
    bottom: 60px;
  }
`;

const Viewer = styled.div`
  position: relative;
  width: auto;
  height: auto;
  margin: 0 auto; 

  .page {
    margin: 10px auto; 
    background-color: white;

    @media (max-width: 768px) {
      margin: 0 auto;
      &:not(:last-child) {
        margin-bottom: 10px;
      }
    }
  }
`;

const LoadingBar = styled.div`
  position: relative;
  height: 3px;
  width: 100%;
  background-color: rgba(51, 51, 51, 0.1);
  transition: all 0.2s ease;
`;

const Progress = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background-color: #2196f3;
  transition: width 0.2s;
`;

const Glimmer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  width: 50px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: ${glimmerAnimation} 1.5s ease-in-out infinite;
`;

const ErrorWrapper = styled.div<{ isHidden: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: ${props => (props.isHidden ? 'none' : 'block')};
`;

const ErrorInfo = styled.pre`
  margin-top: 10px;
  white-space: pre-wrap;
`;

const Footer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    height: 60px;
    padding: 10px;
    justify-content: space-between;
    
    /* 在移动端隐藏某些控件 */
    .desktop-only {
      display: none;
    }
  }
`;

const PageInput = styled.input`
  width: 50px;
  text-align: center;
`;

const Button = styled.button`
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 16px;
    min-width: 44px;
    height: 40px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background-color: #f0f0f0;
  }
`;

// 添加一个检测移动设备的函数
const isMobileDevice = () => {
  return window.innerWidth <= 768;
};

export default function PDFViewerComponent({ getTitle, getPageNumber, fileUrl }: PDFViewerProps) {
  const pageRenderRef = useRef<HTMLDivElement>(null);
  const errorWrapper = useRef<HTMLDivElement>(null);
  const [currentScale, setCurrentScale] = useState(1);

  const [state, setState] = useState<PDFViewerState>({
    USE_ONLY_CSS_ZOOM: true,
    TEXT_LAYER_MODE: 0,
    MAX_IMAGE_SIZE: 1024 * 1024,
    CMAP_URL: CMAP_URL,
    CMAP_PACKED: true,
    DEFAULT_URL: fileUrl,
    DEFAULT_SCALE_DELTA: 1.1,
    MIN_SCALE: 0.25,
    MAX_SCALE: 10.0,
    DEFAULT_SCALE_VALUE: '1.0',
    toPageNumber: '1',
    preDisabled: false,
    nextDisabled: false,
    errorWrapperHide: true,
    errorMoreInfoHide: true,
    title: '',
    url: '',
    errorMessage: '',
    errorMoreInfo: ''
  });

  // 使用 refs 存储 PDF 相关实例
  const instanceRef = useRef({
    pdfViewer: null as any,
    eventBus: null as any,
    pdfLinkService: null as any,
    l10n: null as any,
    pdfHistory: null as any,
    pdfLoadingTask: null as any,
    pdfDocument: null as any
  });

  // 获取加载进度条
  const getLoadingBar = useCallback(() => {
    const bar = new PDFViewer.ProgressBar('loadingBar');
    return PDFJS.shadow(instanceRef.current, 'loadingBar', bar);
  }, []);

  // 设置文档标题
  const setTitle = useCallback(
    (title: string) => {
      document.title = title;
      setState(prev => ({ ...prev, title }));
      getTitle?.(title);
    },
    [getTitle]
  );

  // 从 URL 设置标题
  const setTitleUsingUrl = useCallback(
    (url: string) => {
      setState(prev => ({ ...prev, url }));
      let title = PDFJS.getFilenameFromUrl(url) || url;
      try {
        title = decodeURIComponent(title);
      } catch (e) {
        // 解码失败时使用原始 URL
      }
      setTitle(title);
    },
    [setTitle]
  );

  // 处理错误
  const handleError = useCallback(async (message: string, moreInfo: any) => {
    const l10n = instanceRef.current.l10n as ExtendedL10n;
    const moreInfoText = [
      l10n.get(
        'error_version_info',
        { version: PDFJS.version || '?', build: PDFJS.build || '?' },
        'PDF.js v{{version}} (build: {{build}})'
      )
    ];

    if (moreInfo) {
      moreInfoText.push(l10n.get('error_message', { message: moreInfo.message }, 'Message: {{message}}'));
      if (moreInfo.stack) {
        moreInfoText.push(l10n.get('error_stack', { stack: moreInfo.stack }, 'Stack: {{stack}}'));
      }
    }

    setState(prev => ({
      ...prev,
      errorWrapperHide: false,
      errorMessage: message
    }));

    const parts = await Promise.all(moreInfoText);
    setState(prev => ({
      ...prev,
      errorMoreInfo: parts.join('\n')
    }));
  }, []);

  // 关闭 PDF
  const closePDF = useCallback(async () => {
    setState(prev => ({
      ...prev,
      errorWrapperHide: true
    }));

    if (!instanceRef.current.pdfLoadingTask) {
      return Promise.resolve();
    }

    const promise = instanceRef.current.pdfLoadingTask.destroy();
    instanceRef.current.pdfLoadingTask = null;

    if (instanceRef.current.pdfDocument) {
      instanceRef.current.pdfDocument = null;
      instanceRef.current.pdfViewer.setDocument(null);
      instanceRef.current.pdfLinkService.setDocument(null, null);

      if (instanceRef.current.pdfHistory) {
        instanceRef.current.pdfHistory.reset();
      }
    }

    return promise;
  }, []);

  // 打开 PDF
  const openPDF = useCallback(
    async (params: { url: string }) => {
      try {
        if (instanceRef.current.pdfLoadingTask) {
          await closePDF();
        }

        const { url } = params;
        setTitleUsingUrl(url);

        const loadingTask = PDFJS.getDocument({
          url,
          maxImageSize: state.MAX_IMAGE_SIZE,
          cMapUrl: state.CMAP_URL,
          cMapPacked: state.CMAP_PACKED
        });

        instanceRef.current.pdfLoadingTask = loadingTask;

        loadingTask.onProgress = (progressData: any) => {
          const progress = progressData.loaded / progressData.total;
          const percent = Math.round(progress * 100);
          const loadingBar = getLoadingBar();
          if (percent > loadingBar.percent || isNaN(percent)) {
            loadingBar.percent = percent;
          }
        };

        const pdfDocument = await loadingTask.promise;
        instanceRef.current.pdfDocument = pdfDocument;
        instanceRef.current.pdfViewer.setDocument(pdfDocument);
        instanceRef.current.pdfLinkService.setDocument(pdfDocument);
        instanceRef.current.pdfHistory.initialize({ fingerprint: pdfDocument.fingerprints[0] });
        getLoadingBar().hide();
      } catch (exception: any) {
        console.error(exception);
        const message = exception?.message;
        let loadingErrorMessage = 'An error occurred while loading the PDF.';

        if (exception instanceof PDFJS.InvalidPDFException) {
          loadingErrorMessage = 'Invalid or corrupted PDF file.';
        } else if (exception instanceof PDFJS.MissingPDFException) {
          loadingErrorMessage = 'Missing PDF file.';
        } else if (exception instanceof PDFJS.UnexpectedResponseException) {
          loadingErrorMessage = 'Unexpected server response.';
        }

        handleError(loadingErrorMessage, { message });
        getLoadingBar().hide();
      }
    },
    [state.MAX_IMAGE_SIZE, state.CMAP_URL, state.CMAP_PACKED, closePDF, getLoadingBar, handleError, setTitleUsingUrl]
  );

  // 初始化 PDF 查看器
  const initPDFViewer = useCallback(() => {
    try {
      const eventBus = new PDFViewer.EventBus();
      instanceRef.current.eventBus = eventBus;

      const linkService = new PDFViewer.PDFLinkService({
        eventBus,
        externalLinkTarget: 2
      }) as ExtendedPDFLinkService;

      linkService.isInPresentationMode = false;
      linkService.executeSetOCGState = () => {};

      instanceRef.current.pdfLinkService = linkService;

      if (!pageRenderRef.current) {
        throw new Error('PDF container element not found');
      }

      const pdfViewer = new PDFViewer.PDFViewer({
        container: pageRenderRef.current,
        eventBus,
        linkService,
        l10n: createSimpleL10n(),
        useOnlyCssZoom: state.USE_ONLY_CSS_ZOOM,
        textLayerMode: state.TEXT_LAYER_MODE
      });

      linkService.setViewer(pdfViewer);
      instanceRef.current.pdfViewer = pdfViewer;
      instanceRef.current.l10n = createSimpleL10n();

      const pdfHistory = new PDFViewer.PDFHistory({
        eventBus,
        linkService
      });
      instanceRef.current.pdfHistory = pdfHistory;
      linkService.setHistory(pdfHistory);

      // 事件监听
      setupEventListeners(eventBus, pdfViewer);

      // 设置移动端的默认缩放
      if (isMobileDevice()) {
        pdfViewer.currentScaleValue = 'page-width'; // 使用页面宽度作为默认缩放
      }

      if (!pdfViewer) {
        throw new Error('PDF viewer initialization failed');
      }
    } catch (error) {
      console.error('PDF viewer initialization error:', error);
    }
  }, [state.USE_ONLY_CSS_ZOOM, state.TEXT_LAYER_MODE]);

  // 设置事件监听器
  const setupEventListeners = (eventBus: any, pdfViewer: any) => {
    eventBus.on('pagesinit', () => {
      // 根据设备类型设置初始缩放
      if (isMobileDevice()) {
        pdfViewer.currentScaleValue = 'page-width';
      } else {
        pdfViewer.currentScaleValue = '1.0';
      }
    });

    eventBus.on(
      'pagechanging',
      (evt: any) => {
        const page = evt.pageNumber;
        const numPages = instanceRef.current.pdfDocument?.numPages;

        // 更新状态
        setState(prev => ({
          ...prev,
          toPageNumber: String(page),
          preDisabled: page <= 1,
          nextDisabled: page >= numPages
        }));

        // 获取当前页面的 DOM 元素
        const pageDiv = pageRenderRef.current?.querySelector(`[data-page-number="${page}"]`);
        if (pageDiv) {
          // 使用 scrollIntoView 滚动到对应页面
          pageDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
          });
        }

        getPageNumber?.(page, numPages);
      },
      true
    );

    eventBus.on('scalechanging', (evt: any) => {
      setCurrentScale(evt.scale || 1);
    });
  };

  // 组件挂载时初始化
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      try {
        initPDFViewer();
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (mounted) {
          await openPDF({ url: state.DEFAULT_URL });
        }
      } catch (error) {
        console.error('PDF initialization failed:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
      closePDF();
    };
  }, [initPDFViewer, openPDF, state.DEFAULT_URL, closePDF]);

  // 在组件内部加这些处理函数
  const handleZoomIn = () => {
    if (instanceRef.current?.pdfViewer) {
      const newScale = instanceRef.current.pdfViewer.currentScale * state.DEFAULT_SCALE_DELTA;
      if (newScale <= state.MAX_SCALE) {
        instanceRef.current.pdfViewer.currentScale = newScale;
        setCurrentScale(newScale);
      }
    }
  };

  const handleZoomOut = () => {
    if (instanceRef.current?.pdfViewer) {
      const newScale = instanceRef.current.pdfViewer.currentScale / state.DEFAULT_SCALE_DELTA;
      if (newScale >= state.MIN_SCALE) {
        instanceRef.current.pdfViewer.currentScale = newScale;
        setCurrentScale(newScale);
      }
    }
  };

  const handleResetZoom = () => {
    if (instanceRef.current?.pdfViewer) {
      instanceRef.current.pdfViewer.currentScaleValue = state.DEFAULT_SCALE_VALUE;
      setCurrentScale(1);
    }
  };

  const handlePreviousPage = () => {
    if (instanceRef.current?.pdfViewer) {
      const currentPage = instanceRef.current.pdfViewer.currentPageNumber;
      if (currentPage > 1) {
        instanceRef.current.pdfViewer.currentPageNumber = currentPage - 1;
      }
    }
  };

  const handleNextPage = () => {
    if (instanceRef.current?.pdfViewer) {
      const currentPage = instanceRef.current.pdfViewer.currentPageNumber;
      const numPages = instanceRef.current.pdfDocument?.numPages || 0;
      if (currentPage < numPages) {
        instanceRef.current.pdfViewer.currentPageNumber = currentPage + 1;
      }
    }
  };

  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    startDistance: 0,
    initialScale: 1,
    isDragging: false,
    lastScrollX: 0,
    lastScrollY: 0
  });

  // 处理触摸开始
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // 双指触摸 - 准备缩放
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchState(prev => ({
        ...prev,
        startDistance: distance,
        initialScale: currentScale,
        isDragging: false
      }));
    } else if (e.touches.length === 1) {
      // 单指触摸 - 准备滑动
      const container = document.getElementById('viewerContainer');
      setTouchState(prev => ({
        ...prev,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        isDragging: true,
        lastScrollX: container?.scrollLeft || 0,
        lastScrollY: container?.scrollTop || 0
      }));
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && instanceRef.current?.pdfViewer) {
      // 处理缩放
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const scale = (distance / touchState.startDistance) * touchState.initialScale;
      const newScale = Math.min(Math.max(scale, state.MIN_SCALE), state.MAX_SCALE);
      
      instanceRef.current.pdfViewer.currentScale = newScale;
      setCurrentScale(newScale);
    } else if (e.touches.length === 1 && touchState.isDragging) {
      // 处理拖动
      const deltaX = e.touches[0].clientX - touchState.startX;
      const deltaY = e.touches[0].clientY - touchState.startY;
      const container = document.getElementById('viewerContainer');
      
      if (container) {
        container.scrollLeft = touchState.lastScrollX - deltaX;
        container.scrollTop = touchState.lastScrollY - deltaY;
      }
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    setTouchState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  return (
    <Container>
      <ViewerContainer
        id="viewerContainer"
        ref={pageRenderRef}
        // onTouchStart={handleTouchStart}
        // onTouchMove={handleTouchMove}
        // onTouchEnd={handleTouchEnd}
      >
        <Viewer id="viewer" className="pdfViewer" />
      </ViewerContainer>

      <LoadingBar id="loadingBar">
        <Progress className="progress" />
        <Glimmer className="glimmer" />
      </LoadingBar>

      <ErrorWrapper id="errorWrapper" ref={errorWrapper} isHidden={state.errorWrapperHide}>
        <div>
          <div>{state.errorMessage}</div>
          <Button onClick={() => setState(prev => ({ ...prev, errorWrapperHide: true }))}>Close</Button>
          <Button onClick={() => setState(prev => ({ ...prev, errorMoreInfoHide: !prev.errorMoreInfoHide }))}>
            {state.errorMoreInfoHide ? 'More Information' : 'Less Information'}
          </Button>
          {!state.errorMoreInfoHide && <ErrorInfo>{state.errorMoreInfo}</ErrorInfo>}
        </div>
      </ErrorWrapper>

      <Footer>
        {/* <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handlePreviousPage} disabled={state.preDisabled}>
            {'<'}
          </Button>
          <PageInput
            type="text"
            value={state.toPageNumber}
            onChange={e => {
              const value = e.target.value;
              setState(prev => ({ ...prev, toPageNumber: value }));
              if (value && !isNaN(Number(value))) {
                instanceRef.current.pdfViewer.currentPageNumber = Number(value);
              }
            }}
          />
          <Button onClick={handleNextPage} disabled={state.nextDisabled}>
            {'>'}
          </Button>
        </div> */}

        <div style={{ display: 'flex', gap: '5px' }}>
          <Button onClick={handleZoomOut}>-</Button>
          <span className="desktop-only">{Math.round(currentScale * 100)}%</span>
          <Button onClick={handleZoomIn}>+</Button>
          <Button className="desktop-only" onClick={handleResetZoom}>
            100%
          </Button>
        </div>
      </Footer>
    </Container>
  );
}
