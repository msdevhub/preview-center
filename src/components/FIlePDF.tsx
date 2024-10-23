import { styled } from '@mui/styles'

interface Props {
  fileUrl: string
}

const Container = styled('div')({
  height: '100vh',
  width: '100%',
  overflow: 'hidden',
  borderRadius: '0.5rem', // 等同于 Tailwind 的 rounded-lg
})

const StyledIframe = styled('iframe')({
  border: 'none',
  height: '100%',
  width: '100%',
})

const FilePDF = ({ fileUrl }: Props) => {
  return (
    <Container>
      <StyledIframe
        title="预览文档"
        src={`/pdfviewer/web/viewer.html?file=${encodeURIComponent(fileUrl)}`}
      />
    </Container>
  )
}

export default FilePDF
