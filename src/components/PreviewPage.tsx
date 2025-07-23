import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface PreviewPageProps {
  body: string;
  onBack?: () => void;
  noCard?: boolean;
}

// ルビタグのパース用コンポーネント
const RubyText: React.FC<{ base: string; ruby: string }> = ({ base, ruby }) => (
  <ruby style={{ fontSize: '1em' }}>
    {base}
    <rt style={{ fontSize: '0.6em', fontWeight: 'normal' }}>{ruby}</rt>
  </ruby>
);

const parsePage = (pageText: string) => {
  const lines = pageText.split(/\r?\n/);
  return lines.map((line, idx) => {
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '1em' }} />;
    }
    // タイトルタグ: [chapter:タイトル]
    const chapterMatch = line.match(/^\[chapter:(.+?)\]$/);
    if (chapterMatch) {
      return (
        <Typography key={idx} variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
          {chapterMatch[1]}
        </Typography>
      );
    }
    // ルビタグ: [[rb:漢字 > ふりがな]]
    const rubyRegex = /\[\[rb:([^\s>]+)\s*>\s*([^\]]+)\]\]/g;
    let rubyLine: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = rubyRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        rubyLine.push(line.slice(lastIndex, match.index));
      }
      rubyLine.push(<RubyText key={match.index} base={match[1]} ruby={match[2]} />);
      lastIndex = rubyRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      rubyLine.push(line.slice(lastIndex));
    }
    return <Typography key={idx} component="div">{rubyLine.length > 0 ? rubyLine : line}</Typography>;
  });
};

const PreviewPage: React.FC<PreviewPageProps> = ({ body, onBack, noCard }) => {
  // 改ページタグで分割
  const pages = useMemo(() => body.split(/\[newpage\]/), [body]);
  const [page, setPage] = useState(0);
  const pageCount = pages.length;
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  if (noCard) {
    // モバイル用: カードなし・戻るボタンなし
    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: 'background.paper' }}>
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', pb: pageCount > 1 ? 56 : 0 }}>
          {parsePage(pages[page])}
        </Box>
        {pageCount > 1 && (
          <Box sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3000,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            py: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            // iOSセーフエリア考慮
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            <IconButton onClick={() => setPage(page - 1)} disabled={!canPrev} size="small"><ArrowBackIosNewIcon /></IconButton>
            <Typography variant="body2" sx={{ mx: 2 }}>{page + 1} / {pageCount}</Typography>
            <IconButton onClick={() => setPage(page + 1)} disabled={!canNext} size="small"><ArrowForwardIosIcon /></IconButton>
          </Box>
        )}
      </Box>
    );
  }
  // PC用: カード・戻るボタンあり
  return (
    <Box sx={{ width: '100%', height: '100%', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Paper sx={{ width: '100%', maxWidth: 700, minHeight: 400, p: 4, fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, lineHeight: 1.6, height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} variant="outlined" size="small">
            戻る
          </Button>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {parsePage(pages[page])}
        </Box>
        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
            <IconButton onClick={() => setPage(page - 1)} disabled={!canPrev} size="small"><ArrowBackIosNewIcon /></IconButton>
            <Typography variant="body2" sx={{ mx: 2 }}>{page + 1} / {pageCount}</Typography>
            <IconButton onClick={() => setPage(page + 1)} disabled={!canNext} size="small"><ArrowForwardIosIcon /></IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PreviewPage; 