import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  Chip,
  Tabs,
  Tab,
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
// import { useGoogleDriveGIS } from '../hooks/useGoogleDriveGIS'; // Google Drive連携未実装のためコメントアウト
// Google Drive連携に関するUIや変数も未実装部分はコメントアウト
// const { driveStatus, signIn, uploadData, ... } = useGoogleDriveGIS();

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

const AnalyticsPage: React.FC = () => {
  const novels = useSelector((state: RootState) => state.novels.novels);
  const { stats, wordFrequency, novelRanking, novelRankingNarration, novelRankingDialogue } = useAnalyticsData(novels);
  const [rankingTab, setRankingTab] = useState(0);
  const handleRankingTabChange = (event: React.SyntheticEvent, newValue: number) => setRankingTab(newValue);

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
            頻出語彙ランキング TOP 10
          </Typography>
          <List>
            {wordFrequency.length > 0 ? (
              wordFrequency.slice(0, 10).map((wordData, index) => (
                <ListItem key={wordData.word} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                  <Chip label={`#${index + 1}`} color={index < 3 ? 'primary' : 'default'} sx={{ minWidth: 40, fontWeight: 'bold' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>{wordData.word}</Typography>
                  <Typography variant="body2" color="text.secondary">{wordData.count} 回</Typography>
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                頻出語彙のデータがありません
              </Typography>
            )}
          </List>
        </Paper>

        {/* 作品別ランキング */}
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            作品別ランキング TOP {ANALYTICS_CONSTANTS.MAX_NOVEL_RANKING}
          </Typography>
          <Tabs value={rankingTab} onChange={handleRankingTabChange} centered sx={{ mb: 2 }}>
            <Tab label="総文字数" />
            <Tab label="地の文" />
            <Tab label="セリフ" />
          </Tabs>
          {/* 表彰台・リストのデータ切り替え */}
          {(() => {
            let ranking = novelRanking;
            let valueKey = 'characters';
            let valueLabel = '字';
            if (rankingTab === 1) {
              ranking = novelRankingNarration;
              valueKey = 'narration';
            } else if (rankingTab === 2) {
              ranking = novelRankingDialogue;
              valueKey = 'dialogue';
            }
            return (
              <>
                {/* 表彰台（1～3位） */}
                {ranking.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 2, mb: 2 }}>
                    {/* 2位 */}
                    {ranking[1] && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Paper sx={{ width: 100, height: 100, bgcolor: '#C0C0C0', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
                          borderTopLeftRadius: '30%', borderTopRightRadius: '30%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', fontSize: '2.2rem', lineHeight: 1 }}>2</Typography>
                        </Paper>
                        <Box sx={{ mt: 0.5, textAlign: 'center', maxWidth: 110 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>{ranking[1].title.length > 12 ? ranking[1].title.slice(0,12) + '…' : ranking[1].title}</Typography>
                          <Typography variant="caption" color="text.secondary">{ranking[1][valueKey]?.toLocaleString()}{valueLabel}</Typography>
                        </Box>
                      </Box>
                    )}
                    {/* 1位 */}
                    {ranking[0] && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Paper sx={{ width: 120, height: 120, bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
                          borderTopLeftRadius: '30%', borderTopRightRadius: '30%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', fontSize: '2.7rem', lineHeight: 1 }}>1</Typography>
                        </Paper>
                        <Box sx={{ mt: 0.5, textAlign: 'center', maxWidth: 130 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap>{ranking[0].title.length > 12 ? ranking[0].title.slice(0,12) + '…' : ranking[0].title}</Typography>
                          <Typography variant="caption" color="text.secondary">{ranking[0][valueKey]?.toLocaleString()}{valueLabel}</Typography>
                        </Box>
                      </Box>
                    )}
                    {/* 3位 */}
                    {ranking[2] && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Paper sx={{ width: 90, height: 90, bgcolor: '#CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
                          borderTopLeftRadius: '30%', borderTopRightRadius: '30%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', fontSize: '1.8rem', lineHeight: 1 }}>3</Typography>
                        </Paper>
                        <Box sx={{ mt: 0.5, textAlign: 'center', maxWidth: 100 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>{ranking[2].title.length > 12 ? ranking[2].title.slice(0,12) + '…' : ranking[2].title}</Typography>
                          <Typography variant="caption" color="text.secondary">{ranking[2][valueKey]?.toLocaleString()}{valueLabel}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
                {/* 4位以降リスト */}
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {ranking.length > 3 ? (
                    <List>
                      {ranking.slice(3).map((novel, index) => (
                        <ListItem key={novel.title} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                          <Chip label={`#${index + 4}`} color='default' size='small' sx={{ minWidth: 32, fontWeight: 'bold', fontSize: '1rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', flexGrow: 1, fontSize: '1rem' }} noWrap>{novel.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.95rem' }}>{novel[valueKey]?.toLocaleString()}{valueLabel}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      4位以降のランキングデータがありません
                    </Typography>
                  )}
                </Box>
              </>
            );
          })()}
        </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsPage; 