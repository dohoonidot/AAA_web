import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { fetchVacationRecommendation } from '../../services/vacationRecommendationService';
import type { VacationRecommendationResponse } from '../../types/leave';
import MonthlyDistributionChart from './charts/MonthlyDistributionChart';
import WeekdayDistributionChart from './charts/WeekdayDistributionChart';
import HolidayAdjacentUsageChart from './charts/HolidayAdjacentUsageChart';
import { GradientCard, GradientIconContainer, MarkdownTableWidget } from './vacation/VacationUIComponents';
import {
  VacationUIColors,
  VacationUIRadius,
  VacationUISpacing,
  VacationUIShadows,
} from './vacation/vacationUIConstants';

interface VacationRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  year: number;
}

interface MarkdownTableParserResult {
  tableData: string[][] | null;
  titleText: string | null;
}

const parseMarkdownTable = (markdown: string): string[][] | null => {
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedMarkdown.split('\n');
  if (lines.length === 0) return null;

  const tableData: string[][] = [];

  let headerStartIndex = 0;
  if (lines.length > 0 && lines[0].startsWith('**') && lines[0].includes('|') && !lines[0].includes('---')) {
    headerStartIndex = 1;
  }

  let tableHeaderIndex = -1;
  for (let i = headerStartIndex; i < lines.length; i += 1) {
    if (lines[i].includes('|') && !lines[i].includes('---') && lines[i].split('|').length > 1) {
      tableHeaderIndex = i;
      break;
    }
  }

  if (tableHeaderIndex === -1) return null;

  const parseTableRow = (row: string) => row
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  const headerCells = parseTableRow(lines[tableHeaderIndex]);
  tableData.push(headerCells);

  let dataStartIndex = tableHeaderIndex + 1;
  if (dataStartIndex < lines.length) {
    const separatorLine = lines[dataStartIndex];
    if (separatorLine.includes('|') && (separatorLine.includes('---') || separatorLine.includes(':--') || separatorLine.includes('--:'))) {
      dataStartIndex += 1;
    }
  }

  for (let i = dataStartIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.includes('|') && !line.startsWith('**')) {
      const cells = parseTableRow(line);
      if (cells.length > 0) tableData.push(cells);
    } else if (!line.includes('|')) {
      break;
    }
  }

  return tableData.length > 0 ? tableData : null;
};

const normalizeMarkdown = (markdown: string) => markdown
  .replace(/\\n/g, '\n')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n');

const removeJsonDataFromMarkdown = (markdown: string) => {
  let processedMarkdown = markdown;
  processedMarkdown = processedMarkdown.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  const linesForPreference = processedMarkdown.split('\n');
  const preferenceFiltered: string[] = [];
  let skipJsonBlock = false;

  for (const line of linesForPreference) {
    if (!skipJsonBlock && line.includes('연속 휴가 선호') && line.includes('{')) {
      preferenceFiltered.push(line.split('{')[0].trimRight());
      skipJsonBlock = true;
      if (line.includes('}')) {
        skipJsonBlock = false;
      }
      continue;
    }

    if (skipJsonBlock) {
      if (line.includes('}')) {
        skipJsonBlock = false;
      }
      continue;
    }

    preferenceFiltered.push(line);
  }

  processedMarkdown = preferenceFiltered.join('\n');

  processedMarkdown = processedMarkdown.replace(/📅\s*\}/g, '📅');

  processedMarkdown = processedMarkdown.replace(/\{[^{}]*"weekday_counts"[^}]*\}/g, '');
  processedMarkdown = processedMarkdown.replace(/\{[^{}]*"holiday_adjacent"[^}]*\}/g, '');
  processedMarkdown = processedMarkdown.replace(/\{[^{}]*"total_leave_days"[^}]*\}/g, '');

  const lines = processedMarkdown.split('\n');
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '}' || trimmed === '},') {
      continue;
    }
    const hasJsonKeys = line.includes('weekday_counts')
      || line.includes('holiday_adjacent')
      || line.includes('total_leave_days')
      || line.includes('"mon"')
      || line.includes('"tue"')
      || line.includes('"wed"')
      || line.includes('"thu"')
      || line.includes('"fri"')
      || line.includes('"sat"')
      || line.includes('"sun"');
    const trimmedLine = line.trim();
    const looksLikeJsonOnly = trimmedLine.startsWith('{') || trimmedLine.startsWith('"') || trimmedLine === '}';

    if (hasJsonKeys && looksLikeJsonOnly) {
      continue;
    }
    filteredLines.push(line);
  }

  processedMarkdown = filteredLines.join('\n');
  processedMarkdown = processedMarkdown.replace(/\n\s*\n\s*\n/g, '\n\n');

  return processedMarkdown.trim();
};

const applyMarkdownLineBreaks = (content: string) => {
  if (!content) return '';
  return content.split('```').map((part, index) => {
    if (index % 2 === 1) return part;
    return part.replace(/\n/g, '  \n');
  }).join('```');
};

const extractRecommendedDatesTable = (content: string): MarkdownTableParserResult => {
  const recommendIndex = content.indexOf('📅');
  if (recommendIndex === -1) return { tableData: null, titleText: null };

  const afterRecommend = content.substring(recommendIndex);
  const lines = afterRecommend.split('\n');
  const tableLines: string[] = [];
  let tableStarted = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      tableStarted = true;
      tableLines.push(trimmed);
    } else if (tableStarted && trimmed.length === 0) {
      break;
    } else if (tableStarted && !trimmed.startsWith('|')) {
      break;
    }
  }

  if (tableLines.length === 0) return { tableData: null, titleText: null };

  const tableData = parseMarkdownTable(tableLines.join('\n'));
  if (!tableData || tableData.length === 0) return { tableData: null, titleText: null };

  let titleText = '📅 추천 휴가 날짜';
  const titleLine = lines.find((line) => line.includes('📅')) || '';
  const match = titleLine.match(/\((\d+)일\)/);
  if (match) {
    titleText = `📅 추천 휴가 날짜 (${match[1]}일)`;
  }

  return { tableData, titleText };
};

const extractConsecutivePeriodsFromMarkdown = (content: string) => {
  const processedContent = normalizeMarkdown(content);
  const periodKeyword = '**주요 연속 휴가 기간:**';
  const periodIndex = processedContent.indexOf(periodKeyword);
  if (periodIndex === -1) return [] as string[];

  const afterPeriod = processedContent.substring(periodIndex + periodKeyword.length);
  const lines = afterPeriod.split('\n');
  const periodLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (/(\d{4}-\d{2}-\d{2})/.test(trimmed) || trimmed.includes('징검다리') || trimmed.includes('연휴')) {
      periodLines.push(trimmed.replace(/^\s*[-•]\s*/, '').replace(/\\n/g, '\n'));
    }
  }

  return periodLines;
};

const extractAnalysisSummary = (content: string) => {
  const conflictIndex = content.indexOf('🧩');
  const recommendIndex = content.indexOf('📅');
  let analysisContent = '';

  if (conflictIndex !== -1) {
    analysisContent = content.substring(0, conflictIndex);
  } else if (recommendIndex !== -1) {
    analysisContent = content.substring(0, recommendIndex);
  } else {
    analysisContent = content;
  }

  const cleaned = removeJsonDataFromMarkdown(analysisContent);
  return cleaned.trim().length > 0 ? cleaned : null;
};

const extractTeamConflictAnalysis = (content: string) => {
  const conflictIndex = content.indexOf('🧩');
  if (conflictIndex === -1) return null;

  const recommendIndex = content.indexOf('📅');
  let conflictContent = '';

  if (recommendIndex !== -1 && recommendIndex > conflictIndex) {
    conflictContent = content.substring(conflictIndex, recommendIndex);
  } else {
    conflictContent = content.substring(conflictIndex);
  }

  const cleaned = removeJsonDataFromMarkdown(conflictContent).trim();
  return cleaned.length > 0 ? cleaned : null;
};

const extractRecommendationPlan = (content: string) => {
  const recommendIndex = content.indexOf('📅');
  const periodKeyword = '**주요 연속 휴가 기간:**';
  const periodIndex = content.indexOf(periodKeyword);
  let planContent = '';

  if (recommendIndex !== -1) {
    const afterRecommend = content.substring(recommendIndex);
    const tableEndRegex = /\|\s*\d+월\s*\|[^\n]*\n\s*\n/;
    const tableEndMatch = afterRecommend.match(tableEndRegex);

    if (tableEndMatch) {
      const afterTable = afterRecommend.substring(tableEndMatch.index + tableEndMatch[0].length);
      const localPeriodIndex = afterTable.indexOf(periodKeyword);

      if (localPeriodIndex !== -1) {
        const afterPeriod = afterTable.substring(localPeriodIndex);
        const periodEndRegex = /\n\s*\n\s*\n/;
        const periodEndMatch = afterPeriod.match(periodEndRegex);

        if (periodEndMatch) {
          planContent = afterTable.substring(0, localPeriodIndex)
            + afterPeriod.substring(0, periodEndMatch.index + periodEndMatch[0].length);
        } else {
          planContent = afterTable;
        }
      } else {
        planContent = afterTable;
      }
    } else if (periodIndex !== -1 && periodIndex > recommendIndex) {
      planContent = content.substring(recommendIndex, periodIndex);
      const firstNewline = planContent.indexOf('\n');
      if (firstNewline !== -1) {
        planContent = planContent.substring(firstNewline + 1);
      }
    } else {
      const firstNewline = afterRecommend.indexOf('\n');
      if (firstNewline !== -1) {
        planContent = afterRecommend.substring(firstNewline + 1);
      } else {
        planContent = afterRecommend;
      }
    }
  } else if (periodIndex !== -1) {
    planContent = content.substring(0, periodIndex);
  } else {
    planContent = content;
  }

  planContent = removeJsonDataFromMarkdown(planContent);
  return planContent.trim().length > 0 ? planContent : null;
};

const VacationRecommendationModal: React.FC<VacationRecommendationModalProps> = ({
  open,
  onClose,
  userId,
  year,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [state, setState] = useState<VacationRecommendationResponse>({
    reasoningContents: '',
    finalResponseContents: '',
    recommendedDates: [],
    monthlyDistribution: {},
    consecutivePeriods: [],
    isComplete: false,
    streamingProgress: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    progressTimerRef.current = window.setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev < targetProgress) {
          return Math.min(targetProgress, prev + 0.01);
        }
        if (prev > targetProgress) {
          return targetProgress;
        }
        return prev;
      });
    }, 500);

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [open, targetProgress]);

  useEffect(() => {
    if (!open || !userId) return;
    startRecommendation();
  }, [open, userId, year]);

  useEffect(() => {
    if (state.isComplete) {
      setTargetProgress(1.0);
      return;
    }
    if (isLoading) {
      setTargetProgress(0.3);
      return;
    }
    setTargetProgress(state.streamingProgress || 0.0);
  }, [state.isComplete, state.streamingProgress, isLoading]);

  const startRecommendation = async () => {
    setError(null);
    setIsLoading(true);
    setAnimatedProgress(0);
    setTargetProgress(0);
    setState({
      reasoningContents: '',
      finalResponseContents: '',
      recommendedDates: [],
      monthlyDistribution: {},
      consecutivePeriods: [],
      isComplete: false,
      streamingProgress: 0,
    });

    try {
      const generator = fetchVacationRecommendation(userId, year);
      for await (const update of generator) {
        setIsLoading(false);
        setState(update);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || '추천 데이터를 가져오는 중 에러가 발생했습니다.');
    }
  };

  const parseLoadingStatusMessages = (text: string) => {
    const lines = text.split('\n');
    const statusLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('📥')
        || trimmed.startsWith('👥')
        || trimmed.startsWith('🗓️')
        || trimmed.startsWith('🧾')
        || trimmed.startsWith('✨')
        || trimmed.startsWith('📊')) {
        statusLines.push(trimmed);
      }
    }
    return statusLines;
  };

  const markdownComponents = useMemo(() => ({
    p: ({ children }: any) => (
      <Typography
        sx={{
          fontSize: '14px',
          lineHeight: 1.8,
          color: isDark ? '#D1D5DB' : '#4B5563',
          mb: 1.5,
        }}
      >
        {children}
      </Typography>
    ),
    li: ({ children }: any) => (
      <Typography
        component="li"
        sx={{
          fontSize: '14px',
          lineHeight: 1.8,
          color: isDark ? '#D1D5DB' : '#4B5563',
        }}
      >
        {children}
      </Typography>
    ),
    del: ({ children }: any) => (
      <Box component="span" sx={{ textDecoration: 'none' }}>
        {children}
      </Box>
    ),
    strong: ({ children }: any) => (
      <Box component="span" sx={{ fontWeight: 700, color: isDark ? 'white' : '#1A1D29' }}>
        {children}
      </Box>
    ),
    table: ({ children }: any) => (
      <Box
        sx={{
          overflowX: 'auto',
          my: 2,
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#505050' : '#E9ECEF'}`,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
      </Box>
    ),
    thead: ({ children }: any) => (
      <thead style={{ backgroundColor: isDark ? '#4A4A4A' : '#F8F9FA' }}>{children}</thead>
    ),
    tr: ({ children }: any) => (
      <tr style={{ borderBottom: `1px solid ${isDark ? '#505050' : '#E9ECEF'}` }}>{children}</tr>
    ),
    th: ({ children }: any) => (
      <th
        style={{
          padding: '10px 12px',
          fontSize: '13px',
          fontWeight: 700,
          color: isDark ? '#FFFFFF' : '#1A1D29',
          textAlign: 'left',
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td
        style={{
          padding: '10px 12px',
          fontSize: '13px',
          color: isDark ? '#FFFFFF' : '#1A1D29',
        }}
      >
        {children}
      </td>
    ),
  }), [isDark]);

  const analysisSummary = useMemo(() => (
    state.finalResponseContents
      ? extractAnalysisSummary(state.finalResponseContents)
      : null
  ), [state.finalResponseContents]);

  const teamConflictAnalysis = useMemo(() => (
    state.finalResponseContents
      ? extractTeamConflictAnalysis(state.finalResponseContents)
      : null
  ), [state.finalResponseContents]);

  const recommendationPlan = useMemo(() => (
    state.finalResponseContents
      ? extractRecommendationPlan(state.finalResponseContents)
      : null
  ), [state.finalResponseContents]);

  const recommendedTable = useMemo(() => (
    state.finalResponseContents
      ? extractRecommendedDatesTable(state.finalResponseContents)
      : { tableData: null, titleText: null }
  ), [state.finalResponseContents]);

  const consecutivePeriods = useMemo(() => (
    state.finalResponseContents
      ? extractConsecutivePeriodsFromMarkdown(state.finalResponseContents)
      : []
  ), [state.finalResponseContents]);

  const loadingStatusLines = useMemo(() => parseLoadingStatusMessages(state.reasoningContents), [state.reasoningContents]);

  const showLoadingState = isLoading
    && !state.reasoningContents
    && !state.markdownBuffer
    && !state.leavesData
    && !state.weekdayCountsData
    && !error;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: '95vw', sm: '750px' },
          height: { xs: '90vh', sm: '800px' },
          maxWidth: '95vw',
          borderRadius: `${VacationUIRadius.xLarge}px`,
          background: `linear-gradient(135deg, ${(
            isDark ? VacationUIColors.darkBackgroundGradient : VacationUIColors.lightBackgroundGradient
          ).join(', ')})`,
          boxShadow: VacationUIShadows.modalShadow(isDark),
          p: `${VacationUISpacing.paddingXXL}px`,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <GradientIconContainer icon={<AutoAwesomeIcon />} size={28} />
        <Box sx={{ ml: 2, flex: 1 }}>
          <Box
            sx={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${VacationUIColors.primaryGradient[0]} 0%, ${VacationUIColors.primaryGradient[1]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <Typography sx={{ fontSize: '24px', fontWeight: 700 }}>내 휴가계획 AI 추천</Typography>
          </Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#9CA3AF' : '#6B7280', mt: 0.5 }}>
            {year}년 연차 사용 계획
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ height: 20 }} />

      <Divider sx={{ height: '1px', bgcolor: isDark ? '#505050' : '#E9ECEF' }} />

      {/* 진행률 바 */}
      {(!state.isComplete || isLoading) && !error && (
        <Box
          sx={{
            mt: '20px',
            mb: '12px',
            height: '8px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: isDark
                ? 'linear-gradient(135deg, #3A3A3A 0%, #2D2D2D 100%)'
                : 'linear-gradient(135deg, #E8E8E8 0%, #F0F0F0 100%)',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${animatedProgress * 100}%`,
                background: `linear-gradient(90deg, ${VacationUIColors.accentGradient.join(', ')})`,
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
        </Box>
      )}

      <Box sx={{ height: 12 }} />

      {/* 스크롤 가능한 내용 영역 */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {error ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A1D29' }}>
                오류가 발생했습니다
              </Typography>
            </Box>
            <Typography sx={{ color: isDark ? '#9CA3AF' : '#6B7280', mb: 3 }}>
              {error}
            </Typography>
            <Button variant="contained" onClick={startRecommendation} sx={{ bgcolor: '#4A90E2' }}>
              다시 시도
            </Button>
          </Box>
        ) : showLoadingState ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#6B7280' }}>
              AI가 휴가 계획을 분석하고 있습니다...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* 영역 1: 사용자 경향 분석 */}
            <Box
              sx={{
                width: '100%',
                p: '20px',
                background: isDark
                  ? 'linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 100%)'
                  : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                boxShadow: isDark
                  ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                  : '0 4px 16px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    p: '10px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AnalyticsOutlinedIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography
                  sx={{
                    ml: '14px',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isDark ? '#FFFFFF' : '#1E293B',
                  }}
                >
                  사용자 경향 분석
                </Typography>
              </Box>

              <Box sx={{ height: 20 }} />

              {loadingStatusLines.length > 0 && (
                <Box
                  sx={{
                    p: '14px',
                    bgcolor: isDark ? 'rgba(30, 30, 30, 0.6)' : '#F1F5F9',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: '10px' }}>
                    {state.isComplete ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    ) : (
                      <HourglassTopIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                    )}
                    <Typography
                      sx={{
                        ml: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isDark ? '#FFFFFF' : '#374151',
                      }}
                    >
                      {state.isComplete ? '데이터 로드 완료' : '데이터 로드 중...'}
                    </Typography>
                  </Box>
                  {loadingStatusLines.map((line, index) => (
                    <Typography
                      key={index}
                      sx={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        mb: index === loadingStatusLines.length - 1 ? 0 : 0.5,
                      }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              )}

              {state.leavesData && Object.keys(state.leavesData.monthlyUsage || {}).length > 0 && (
                <Box sx={{ mt: loadingStatusLines.length > 0 ? 2.5 : 0 }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#374151',
                    }}
                  >
                    📈 과거 휴가 사용 내역
                  </Typography>
                  <Box sx={{ height: 12 }} />
                  <GradientCard isDarkTheme={isDark}>
                    <MonthlyDistributionChart
                      monthlyData={state.leavesData.monthlyUsage}
                      isDarkTheme={isDark}
                    />
                  </GradientCard>
                </Box>
              )}

              {state.isComplete && state.weekdayCountsData && Object.keys(state.weekdayCountsData.counts || {}).length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#374151',
                    }}
                  >
                    📊 요일별 연차 사용량
                  </Typography>
                  <Box sx={{ height: 12 }} />
                  <GradientCard isDarkTheme={isDark}>
                    <WeekdayDistributionChart
                      weekdayData={state.weekdayCountsData.counts}
                      isDarkTheme={isDark}
                    />
                  </GradientCard>
                </Box>
              )}

              {state.isComplete && state.holidayAdjacentUsageRate !== undefined && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#374151',
                    }}
                  >
                    🎯 공휴일 인접 사용률
                  </Typography>
                  <Box sx={{ height: 12 }} />
                  <GradientCard isDarkTheme={isDark} padding={12}>
                    <Box sx={{ height: 180 }}>
                      <HolidayAdjacentUsageChart
                        usageRate={state.holidayAdjacentUsageRate}
                        isDarkTheme={isDark}
                      />
                    </Box>
                  </GradientCard>
                </Box>
              )}

              {state.isAfterAnalysisMarker && state.markdownBuffer && !state.isComplete && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#374151',
                    }}
                  >
                    💡 AI 분석 결과
                  </Typography>
                  <Box sx={{ height: 12 }} />
                  <GradientCard isDarkTheme={isDark}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {applyMarkdownLineBreaks(normalizeMarkdown(removeJsonDataFromMarkdown(state.markdownBuffer)))}
                    </ReactMarkdown>
                  </GradientCard>
                </Box>
              )}

              {state.isComplete && analysisSummary && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isDark ? '#FFFFFF' : '#374151',
                    }}
                  >
                    💡 경향 분석 요약
                  </Typography>
                  <Box sx={{ height: 12 }} />
                  <GradientCard isDarkTheme={isDark}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {applyMarkdownLineBreaks(normalizeMarkdown(analysisSummary))}
                    </ReactMarkdown>
                  </GradientCard>
                </Box>
              )}
            </Box>

            <Box sx={{ height: 24 }} />

            {state.isComplete && teamConflictAnalysis && (
              <Box
                sx={{
                  width: '100%',
                  p: '20px',
                  background: isDark
                    ? 'linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: '10px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleOutlineIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography
                    sx={{
                      ml: '14px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: isDark ? '#FFFFFF' : '#1E293B',
                    }}
                  >
                    팀 충돌 분석
                  </Typography>
                </Box>
                <Box sx={{ height: 20 }} />
                <GradientCard isDarkTheme={isDark}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {applyMarkdownLineBreaks(normalizeMarkdown(teamConflictAnalysis))}
                  </ReactMarkdown>
                </GradientCard>
              </Box>
            )}

            {state.isComplete && teamConflictAnalysis && (
              <Box sx={{ height: 24 }} />
            )}

            {state.isComplete && (
              <Box
                sx={{
                  width: '100%',
                  p: '20px',
                  background: isDark
                    ? 'linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: '10px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LightbulbOutlinedIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography
                    sx={{
                      ml: '14px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: isDark ? '#FFFFFF' : '#1E293B',
                    }}
                  >
                    추천 계획
                  </Typography>
                </Box>

                <Box sx={{ height: 20 }} />

                {recommendedTable.tableData && recommendedTable.titleText && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isDark ? '#FFFFFF' : '#374151',
                      }}
                    >
                      {recommendedTable.titleText}
                    </Typography>
                    <Box sx={{ height: 12 }} />
                    <MarkdownTableWidget
                      tableData={recommendedTable.tableData}
                      isDarkTheme={isDark}
                    />
                    <Box sx={{ height: 24 }} />
                  </Box>
                )}

                {recommendationPlan && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isDark ? '#FFFFFF' : '#374151',
                      }}
                    >
                      ✍️ 연차 사용 계획 설명
                    </Typography>
                    <Box sx={{ height: 12 }} />
                    <GradientCard isDarkTheme={isDark}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {applyMarkdownLineBreaks(normalizeMarkdown(recommendationPlan))}
                      </ReactMarkdown>
                    </GradientCard>
                    <Box sx={{ height: 24 }} />
                  </Box>
                )}

                {Object.keys(state.monthlyDistribution).length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isDark ? '#FFFFFF' : '#374151',
                      }}
                    >
                      📈 월별 연차 사용 분포
                    </Typography>
                    <Box sx={{ height: 12 }} />
                    <GradientCard isDarkTheme={isDark}>
                      <MonthlyDistributionChart
                        monthlyData={state.monthlyDistribution}
                        isDarkTheme={isDark}
                      />
                    </GradientCard>
                    <Box sx={{ height: 24 }} />
                  </Box>
                )}

                {consecutivePeriods.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: isDark ? '#FFFFFF' : '#374151',
                      }}
                    >
                      🏖️ 주요 연속 휴가 기간
                    </Typography>
                    <Box sx={{ height: 12 }} />
                    {consecutivePeriods.map((line, index) => (
                      <Box
                        key={`${line}-${index}`}
                        sx={{
                          mb: '10px',
                          p: '14px',
                          background: isDark
                            ? `linear-gradient(135deg, ${VacationUIColors.darkCardGradient[0]} 0%, ${VacationUIColors.darkCardGradient[1]} 100%)`
                            : `linear-gradient(135deg, ${VacationUIColors.lightCardGradient[0]} 0%, ${VacationUIColors.lightCardGradient[1]} 100%)`,
                          borderRadius: '12px',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                        }}
                      >
                        <GradientIconContainer icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />} size={16} />
                        <Typography
                          sx={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: isDark ? '#FFFFFF' : '#1A1D29',
                            lineHeight: 1.5,
                          }}
                        >
                          {line}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ height: 20 }} />

      <Box
        sx={{
          width: '100%',
          height: '52px',
          borderRadius: `${VacationUIRadius.medium}px`,
          border: `1.5px solid ${isDark ? 'rgba(80, 80, 80, 0.5)' : '#E0E0E0'}`,
          background: isDark
            ? 'linear-gradient(135deg, #4A4A4A 0%, #3A3A3A 100%)'
            : 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)',
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Button
          onClick={onClose}
          fullWidth
          sx={{
            height: '100%',
            color: isDark ? '#FFFFFF' : '#1A1D29',
            fontWeight: 600,
            fontSize: '16px',
            letterSpacing: '-0.3px',
            borderRadius: `${VacationUIRadius.medium}px`,
            '&:hover': {
              background: 'transparent',
            },
          }}
        >
          닫기
        </Button>
      </Box>
    </Dialog>
  );
};

export default VacationRecommendationModal;
