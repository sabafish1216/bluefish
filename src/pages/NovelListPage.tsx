import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';
import { List, Button, Box, Typography, Dialog, DialogTitle, DialogActions } from '@mui/material';
import NovelListItem from '../components/NovelListItem';
import { deleteNovel } from '../features/novels/novelsSlice';
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';

const NovelListPage: React.FC = () => {
  const novels = useSelector((state: RootState) => state.novels.novels);
  const folders = useSelector((state: RootState) => state.folders.folders);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { deleteNovelFromDrive, syncStatus } = useGoogleDriveSync();

  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };
  
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        // Google Drive連携時はGoogle Driveからも削除
        if (syncStatus.isSignedIn) {
          console.log('Google Drive連携時 - Google Driveからも削除');
          await deleteNovelFromDrive(deleteId);
        } else {
          console.log('Google Drive未連携時 - ローカル削除のみ');
        }
        
        // ローカルデータを削除
        dispatch(deleteNovel(deleteId));
      } catch (error) {
        console.error('作品削除エラー:', error);
        // エラーが発生してもローカルデータは削除
        dispatch(deleteNovel(deleteId));
      }
    }
    setDeleteId(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">作品一覧</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/write')}>新規作成</Button>
      </Box>
      {novels.length === 0 ? (
        <Typography color="text.secondary">作品がありません</Typography>
      ) : (
        <List>
          {novels.map(novel => (
            <NovelListItem
              key={novel.id}
              novel={novel}
              folderName={folders.find(f => f.id === novel.folderId)?.name}
              onDelete={handleDelete}
            />
          ))}
        </List>
      )}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>キャンセル</Button>
          <Button color="error" onClick={confirmDelete}>削除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NovelListPage; 