import * as pdf from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.js?url'
import { useEffect, useRef, useState } from "react";

pdf.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFOptions {
  src: string;
  scale?: number;
  method?: 'GET' | 'POST';
  postData?: any;
  headers?: HeadersInit;
}

export const usePDFData = (options: PDFOptions) => {
  const previewUrls = useRef<string[]>([])
  const urls = useRef<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    urls.current = []
    setLoading(true)
    setError(null)
    
    ;(async () => {
      try {
        let pdfData: ArrayBuffer;
        
        if (options.method === 'POST') {
          const response = await fetch(options.src, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...options.headers
            },
            body: JSON.stringify(options.postData)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          pdfData = await response.arrayBuffer();
          const pdfDocument = await pdf.getDocument(pdfData).promise;
        } else {
          const pdfDocument = await pdf.getDocument(options.src).promise;
        }

        const pdfDocument = options.method === 'POST' 
          ? await pdf.getDocument(pdfData!).promise
          : await pdf.getDocument(options.src).promise;

        const task = new Array(pdfDocument.numPages).fill(null)
        await Promise.all(task.map(async (_, i) => {
          const page = await pdfDocument.getPage(i + 1)
          const viewport = page.getViewport({ scale: options.scale || 2 })
          const canvas = document.createElement('canvas')

          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
          });
          await renderTask.promise;
          urls.current[i] = canvas.toDataURL('image/jpeg', 1)
          previewUrls.current[i] = canvas.toDataURL('image/jpeg', 0.5)
        }))
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false)
      }
    })()
  }, [options.src, options.method, options.postData])

  return {
    loading,
    error,
    urls: urls.current,
    previewUrls: previewUrls.current,
  }
}