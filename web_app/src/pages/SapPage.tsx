import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import {
  Business as SapIcon,
} from '@mui/icons-material';
import MobileMainLayout from '../components/layout/MobileMainLayout';
import ChatArea from '../components/chat/ChatArea';
import { useSapPageState } from './SapPage.state';

export default function SapPage() {
  const { state, actions } = useSapPageState();
  const { currentArchive, loading, error, aiModel, selectedModule } = state;
  const { setAiModel, setSelectedModule, handleSendMessage } = actions;

  return (
    <MobileMainLayout>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* SAP 설정 영역 - 모듈 선택과 AI 모델 선택 */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* AI 모델 선택 - 왼쪽에 위치 */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>AI 모델</InputLabel>
              <Select
                value={aiModel}
                label="AI 모델"
                onChange={(e) => setAiModel(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="gemini-flash-2.5">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="⚡" size="small" sx={{ bgcolor: '#4285F4', color: 'white', fontSize: '0.7rem' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Gemini Flash 2.5</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="gpt-5">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="🚀" size="small" sx={{ bgcolor: '#10A37F', color: 'white', fontSize: '0.7rem' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>GPT-5</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="claude-sonnet-4">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="🧠" size="small" sx={{ bgcolor: '#FF6B35', color: 'white', fontSize: '0.7rem' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Claude Sonnet 4</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* SAP 모듈 선택 - 오른쪽에 위치 */}
            <Box sx={{ flex: 1 }} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>SAP 모듈</InputLabel>
              <Select
                value={selectedModule}
                label="SAP 모듈"
                onChange={(e) => setSelectedModule(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>모듈을 선택하세요</em>
                </MenuItem>
                {['BC', 'CO', 'FI', 'HR', 'IS', 'MM', 'PM', 'PP', 'PS', 'QM', 'SD', 'TR', 'WF', 'General'].map(code => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* 채팅 영역 - 더 큰 공간 */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ChatArea
            currentArchive={currentArchive}
            onSendMessage={handleSendMessage}
            showAiModelSelection={false}
            aiModel={aiModel}
            onAiModelChange={setAiModel}
            loading={loading}
            error={error}
          />
        </Box>
      </Box>
    </MobileMainLayout>
  );
}

// 사용하지 않는 컴포넌트들 제거
