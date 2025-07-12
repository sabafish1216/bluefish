import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  Chip
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Book as BookIcon,
  TextFields as TextFieldsIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { ANALYTICS_CONSTANTS } from '../constants/analytics';
import EmptyState from './common/EmptyState';

// 統計カードコンポーネント
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <Card>
    <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ fontSize: 40, color: `${color}.main`, mb: 1 }}>
          {icon}
        </Box>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

// 頻出語彙バブルコンポーネント
interface WordBubbleProps {
  word: string;
  count: number;
  maxCount: number;
  index: number;
}

const WordBubble: React.FC<WordBubbleProps> = ({ word, count, maxCount, index }) => {
  const fontSize = Math.max(12, Math.min(32, 12 + (count / maxCount) * 20));
  const padding = Math.max(4, Math.min(16, 4 + (count / maxCount) * 12));
  const estimatedWidth = word.length * fontSize * 0.6 + padding * 3 + 30;
  const estimatedHeight = fontSize + padding * 2;
  
  const normalizedCount = count / maxCount;
  const radius = ANALYTICS_CONSTANTS.MAX_BUBBLE_RADIUS - (normalizedCount * (ANALYTICS_CONSTANTS.MAX_BUBBLE_RADIUS - ANALYTICS_CONSTANTS.MIN_BUBBLE_RADIUS));
  
  const angle = (index / ANALYTICS_CONSTANTS.MAX_WORD_FREQUENCY) * 2 * Math.PI;
  const baseX = Math.cos(angle) * radius;
  const baseY = Math.sin(angle) * radius;
  
  // 衝突検出と位置調整
  const checkCollision = (x: number, y: number, width: number, height: number, positions: Array<{x: number, y: number, width: number, height: number}>) => {
    return positions.some(pos => {
      return !(x + width + ANALYTICS_CONSTANTS.BUBBLE_MARGIN < pos.x || 
              pos.x + pos.width + ANALYTICS_CONSTANTS.BUBBLE_MARGIN < x || 
              y + height + ANALYTICS_CONSTANTS.BUBBLE_MARGIN < pos.y || 
              pos.y + pos.height + ANALYTICS_CONSTANTS.BUBBLE_MARGIN < y);
    });
  };
  
  const findValidPosition = (baseX: number, baseY: number, width: number, height: number, positions: Array<{x: number, y: number, width: number, height: number}>) => {
    let x = baseX;
    let y = baseY;
    let attempts = 0;
    
    while (checkCollision(x, y, width, height, positions) && attempts < ANALYTICS_CONSTANTS.MAX_BUBBLE_ATTEMPTS) {
      const angle = attempts * 0.4;
      const radius = 25 + attempts * 6;
      x = baseX + Math.cos(angle) * radius;
      y = baseY + Math.sin(angle) * radius;
      
      const maxX = 300;
      const maxY = 200;
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
      
      attempts++;
    }
    
    return { x, y };
  };
  
  const positions: Array<{x: number, y: number, width: number, height: number}> = [];
  const { x, y } = findValidPosition(baseX, baseY, estimatedWidth, estimatedHeight, positions);
  positions.push({ x, y, width: estimatedWidth, height: estimatedHeight });
  
  return (
    <Chip
      label={`${word} (${count})`}
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(${x}px, ${y}px)`,
        fontSize: `${fontSize}px`,
        padding: `${padding}px`,
        backgroundColor: `rgba(25, 118, 210, ${0.3 + normalizedCount * 0.7})`,
        color: 'white',
        fontWeight: 'bold',
        border: '2px solid rgba(25, 118, 210, 0.8)',
        '&:hover': {
          backgroundColor: `rgba(25, 118, 210, ${0.5 + normalizedCount * 0.5})`,
        }
      }}
    />
  );
};

// ランキングアイテムコンポーネント
interface RankingItemProps {
  rank: number;
  title: string;
  characters: number;
  words: number;
}

const RankingItem: React.FC<RankingItemProps> = ({ rank, title, characters, words }) => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // 金
      case 2: return '#C0C0C0'; // 銀
      case 3: return '#CD7F32'; // 銅
      default: return 'grey.400';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return '🏆';
    }
    return `${rank}`;
  };

  return (
    <ListItem sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        gap: 2
      }}>
        <Box sx={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          bgcolor: getRankColor(rank),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: rank <= 3 ? '1.2rem' : '0.9rem'
        }}>
          {getRankIcon(rank)}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {characters.toLocaleString()}文字 / {words.toLocaleString()}単語
          </Typography>
        </Box>
      </Box>
    </ListItem>
  );
};

const AnalyticsPage: React.FC = () => {
  const novels = useSelector((state: RootState) => state.novels.novels);
  const { stats, wordFrequency, novelRanking } = useAnalyticsData(novels);

  // データがない場合の表示
  if (novels.length === 0) {
    return (
      <EmptyState
        icon={AnalyticsIcon}
        title="分析データがありません"
        description="作品を作成すると、ここに執筆統計が表示されます"
        height="100vh"
      />
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 3, overflow: 'auto' }}>

      {/* 基本統計 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4, flexShrink: 0, minHeight: 200 }}>
        <StatCard
          icon={<BookIcon />}
          value={novels.length}
          label="作品数"
          color="primary"
        />
        <StatCard
          icon={<TextFieldsIcon />}
          value={stats.totalCharacters.toLocaleString()}
          label="総文字数"
          color="secondary"
        />
        <StatCard
          icon={<SpeedIcon />}
          value={stats.totalWords.toLocaleString()}
          label="総単語数"
          color="success"
        />
        <StatCard
          icon={<TrendingUpIcon />}
          value={stats.avgCharactersPerNovel.toLocaleString()}
          label="平均文字数"
          color="info"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3, flexGrow: 1, minHeight: 0, maxHeight: '50vh' }}>
        {/* 頻出語彙 */}
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
            <BarChartIcon sx={{ mr: 1 }} />
            頻出語彙 TOP {ANALYTICS_CONSTANTS.MAX_WORD_FREQUENCY}
          </Typography>
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4
          }}>
            {wordFrequency.length > 0 ? (
              wordFrequency.map(({ word, count }, index) => (
                <WordBubble
                  key={word}
                  word={word}
                  count={count}
                  maxCount={wordFrequency[0]?.count || 1}
                  index={index}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                頻出語彙のデータがありません
              </Typography>
            )}
          </Box>
        </Paper>

        {/* 作品別ランキング */}
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            作品別ランキング TOP {ANALYTICS_CONSTANTS.MAX_NOVEL_RANKING}
          </Typography>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {novelRanking.length > 0 ? (
              <List>
                {novelRanking.map((novel, index) => (
                  <RankingItem
                    key={novel.title}
                    rank={index + 1}
                    title={novel.title}
                    characters={novel.characters}
                    words={novel.words}
                  />
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                ランキングデータがありません
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsPage; 