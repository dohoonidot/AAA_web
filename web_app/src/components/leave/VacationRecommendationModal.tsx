import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    LinearProgress,
    Divider,
    Button,
    useTheme,
    Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import DateRangeIcon from '@mui/icons-material/DateRange';
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
import VacationCalendarGrid from './VacationCalendarGrid';

interface VacationRecommendationModalProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    year: number;
}

const VacationRecommendationModal: React.FC<VacationRecommendationModalProps> = ({
    open,
    onClose,
    userId,
    year,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const scrollRef = useRef<HTMLDivElement>(null);

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

    // 마크다운 정리 함수
    const sanitizeMarkdown = (content: string) => {
        if (!content) return '';
        let sanitized = content;
        sanitized = sanitized.replace(/\\n/g, '\n');
        sanitized = sanitized.replace(/~~/g, '~');
        sanitized = sanitized.replace(/```json[\s\S]*?```/g, '');
        sanitized = sanitized.replace(/\b(short|long)\s*\{[^{}]*"weekday_counts"[^}]*\}[^}]*\}/gi, '');
        sanitized = sanitized.replace(/\{[^{}]*"weekday_counts"[^}]*\}[^}]*\}?/g, '');
        sanitized = sanitized.replace(/\{[^{}]*"holiday_adjacent[^}]*\}[^}]*\}?/g, '');
        sanitized = sanitized.replace(/\{[^{}]*"total_leave_days"[^}]*\}[^}]*\}?/g, '');
        sanitized = sanitized.replace(/\{[^{}]*"leaves"[^}]*\}[^}]*\}?/g, '');

        const filtered = sanitized
            .split('\n')
            .filter((line) => {
                const lowered = line.toLowerCase();
                return !(
                    lowered.includes('weekday_counts') ||
                    lowered.includes('holiday_adjacent') ||
                    lowered.includes('total_leave_days') ||
                    lowered.includes('"leaves"') ||
                    lowered.includes('"mon"') ||
                    lowered.includes('"tue"') ||
                    lowered.includes('"wed"') ||
                    lowered.includes('"thu"') ||
                    lowered.includes('"fri"') ||
                    lowered.includes('"sat"') ||
                    lowered.includes('"sun"')
                );
            })
            .join('\n');

        return filtered.replace(/\n{3,}/g, '\n\n').trim();
    };

    const normalizeLineBreaks = (content: string) => {
        if (!content) return '';
        const parts = content.split('```');
        return parts
            .map((part, index) => {
                if (index % 2 === 1) return part;
                return part.replace(/\n/g, '  \n');
            })
            .join('```');
    };

    // 마크다운 컴포넌트
    const markdownComponents = {
        p: ({ children }: any) => (
            <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7, color: isDark ? '#D1D5DB' : '#4B5563' }}>
                {children}
            </Typography>
        ),
        del: ({ children }: any) => <span>{children}</span>,
        table: ({ children }: any) => (
            <Box
                sx={{
                    overflowX: 'auto',
                    mb: 2,
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                }}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
            </Box>
        ),
        thead: ({ children }: any) => (
            <thead style={{ backgroundColor: isDark ? '#111827' : '#F9FAFB' }}>{children}</thead>
        ),
        tbody: ({ children }: any) => <tbody>{children}</tbody>,
        tr: ({ children }: any) => (
            <tr style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#E5E7EB'}` }}>{children}</tr>
        ),
        th: ({ children }: any) => (
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#E5E7EB' : '#374151' }}>
                {children}
            </th>
        ),
        td: ({ children }: any) => (
            <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: isDark ? '#D1D5DB' : '#4B5563' }}>
                {children}
            </td>
        ),
    };

    useEffect(() => {
        if (open && userId) {
            startRecommendation();
        }
    }, [open, userId, year]);

    useEffect(() => {
        if (scrollRef.current && !state.isComplete) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.reasoningContents, state.markdownBuffer]);

    const startRecommendation = async () => {
        setError(null);
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
                setState(update);
            }
        } catch (err: any) {
            setError(err.message || '추천 데이터를 가져오는 중 에러가 발생했습니다.');
        }
    };

    // 로딩 상태 메시지 파싱
    const parseLoadingStatusMessages = (text: string) => {
        const lines = text.split('\n');
        const statusLines: string[] = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('📥') || trimmed.startsWith('👥') || trimmed.startsWith('🗓️') ||
                trimmed.startsWith('🧾') || trimmed.startsWith('✨') || trimmed.startsWith('📊')) {
                statusLines.push(trimmed);
            }
        }
        return statusLines;
    };

    // 섹션 카드 컴포넌트
    const SectionCard = ({ children, gradient }: { children: React.ReactNode; gradient: string[] }) => (
        <Box
            sx={{
                width: '100%',
                p: 2.5,
                background: isDark
                    ? 'linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                boxShadow: isDark
                    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.08)',
                mb: 3,
            }}
        >
            {children}
        </Box>
    );

    // 섹션 헤더 컴포넌트
    const SectionHeader = ({ icon: Icon, title, gradient }: { icon: any; title: string; gradient: string }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2.5 }}>
            <Box
                sx={{
                    p: 1.25,
                    borderRadius: '12px',
                    background: gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography
                sx={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isDark ? '#FFFFFF' : '#1E293B',
                }}
            >
                {title}
            </Typography>
        </Box>
    );

    // 서브 섹션 제목
    const SubSectionTitle = ({ title }: { title: string }) => (
        <Typography
            sx={{
                fontSize: '15px',
                fontWeight: 600,
                color: isDark ? '#FFFFFF' : '#374151',
                mb: 1.5,
            }}
        >
            {title}
        </Typography>
    );

    // 그라데이션 카드
    const GradientCard = ({ children, padding = 2 }: { children: React.ReactNode; padding?: number }) => (
        <Box
            sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FBFF',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#3A3A3A' : '#E9ECEF'}`,
                p: padding,
                mb: 2.5,
            }}
        >
            {children}
        </Box>
    );

    // 로딩 상태 메시지 컴포넌트
    const LoadingStatusMessages = () => {
        const statusLines = parseLoadingStatusMessages(state.reasoningContents);
        if (statusLines.length === 0) return null;

        return (
            <Box
                sx={{
                    p: 1.75,
                    bgcolor: isDark ? 'rgba(30, 30, 30, 0.6)' : '#F1F5F9',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? '#3D3D3D' : '#E2E8F0'}`,
                    mb: 2.5,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                    {state.isComplete ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                    ) : (
                        <HourglassTopIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                    )}
                    <Typography
                        sx={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isDark ? '#FFFFFF' : '#374151',
                        }}
                    >
                        {state.isComplete ? '데이터 로드 완료' : '데이터 로드 중...'}
                    </Typography>
                </Box>
                {statusLines.map((line, index) => (
                    <Typography
                        key={index}
                        sx={{
                            fontSize: '12px',
                            lineHeight: 1.5,
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            mb: 0.5,
                        }}
                    >
                        {line}
                    </Typography>
                ))}
            </Box>
        );
    };

    // 팀 충돌 분석 추출
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

        return sanitizeMarkdown(conflictContent).trim() || null;
    };

    // 경향 분석 요약 추출
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

        return sanitizeMarkdown(analysisContent).trim() || null;
    };

    // 추천 계획 설명 추출
    const extractRecommendationPlan = (content: string) => {
        const recommendIndex = content.indexOf('📅');
        const periodKeyword = '**주요 연속 휴가 기간:**';

        if (recommendIndex === -1) return null;

        let planContent = content.substring(recommendIndex);
        const periodIndex = planContent.indexOf(periodKeyword);

        if (periodIndex !== -1) {
            planContent = planContent.substring(0, periodIndex);
        }

        // 테이블 제거
        planContent = planContent.replace(/\|[^\n]*\|/g, '');
        planContent = planContent.replace(/📅[^\n]*/g, '');

        return sanitizeMarkdown(planContent).trim() || null;
    };

    // 연속 휴가 기간 추출
    const extractConsecutivePeriods = (content: string) => {
        const processedContent = content.replace(/\\n/g, '\n');
        const periodKeyword = '**주요 연속 휴가 기간:**';
        const periodIndex = processedContent.indexOf(periodKeyword);

        if (periodIndex === -1) return [];

        const afterPeriod = processedContent.substring(periodIndex + periodKeyword.length);
        const lines = afterPeriod.split('\n');
        const periodLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) continue;
            if (trimmed.match(/\d{4}-\d{2}-\d{2}/) || trimmed.includes('징검다리') || trimmed.includes('연휴')) {
                periodLines.push(trimmed.replace(/^[-•]\s*/, ''));
            }
        }

        return periodLines;
    };

    return (
        <Dialog
            open={open}
            onClose={state.isComplete || error ? onClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    bgcolor: isDark ? '#1F1F1F' : 'white',
                    backgroundImage: isDark
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.02) 100%)'
                        : 'none',
                    maxHeight: '90vh',
                    width: { xs: '95%', sm: '750px' },
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
            }}
        >
            {/* 헤더 */}
            <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        }}
                    >
                        <AutoAwesomeIcon />
                    </Box>
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            내 휴가계획 AI 추천
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: 500 }}>
                            {year}년 AI 연차 사용 계획 제안
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider sx={{ mx: 3, opacity: isDark ? 0.1 : 0.5 }} />

            {/* 진행률 바 */}
            {!state.isComplete && !error && (
                <Box sx={{ px: 3, mt: 2.5, mb: 1.5 }}>
                    <LinearProgress
                        variant="determinate"
                        value={state.streamingProgress * 100}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: isDark ? '#333' : '#F3F4F6',
                            '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #667EEA 0%, #764BA2 100%)',
                                borderRadius: 4,
                            },
                        }}
                    />
                </Box>
            )}

            {/* 스크롤 가능한 내용 영역 */}
            <Box
                ref={scrollRef}
                sx={{
                    p: 3,
                    pt: 2,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {error ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="error" variant="h6" gutterBottom>
                            추천 로드 실패
                        </Typography>
                        <Typography sx={{ color: isDark ? '#9CA3AF' : '#6B7280', mb: 3 }}>
                            {error}
                        </Typography>
                        <Button variant="outlined" onClick={startRecommendation}>
                            다시 시도
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* 영역 1: 사용자 경향 분석 */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <SectionCard gradient={['#8B5CF6', '#6366F1']}>
                            <SectionHeader
                                icon={AnalyticsOutlinedIcon}
                                title="사용자 경향 분석"
                                gradient="linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)"
                            />

                            {/* 로딩 상태 메시지 */}
                            {state.reasoningContents && <LoadingStatusMessages />}

                            {/* 과거 휴가 사용 내역 차트 */}
                            {state.leavesData && Object.keys(state.leavesData.monthlyUsage || {}).length > 0 && (
                                <Fade in timeout={800}>
                                    <Box>
                                        <SubSectionTitle title="📈 과거 휴가 사용 내역" />
                                        <GradientCard>
                                            <MonthlyDistributionChart
                                                monthlyData={state.leavesData.monthlyUsage}
                                                isDarkTheme={isDark}
                                            />
                                        </GradientCard>
                                    </Box>
                                </Fade>
                            )}

                            {/* 요일별 연차 사용량 */}
                            {state.isComplete && state.weekdayCountsData && Object.keys(state.weekdayCountsData.counts || {}).length > 0 && (
                                <Fade in timeout={1000}>
                                    <Box>
                                        <SubSectionTitle title="📊 요일별 연차 사용량" />
                                        <GradientCard>
                                            <WeekdayDistributionChart
                                                weekdayData={state.weekdayCountsData.counts}
                                                isDarkTheme={isDark}
                                            />
                                        </GradientCard>
                                    </Box>
                                </Fade>
                            )}

                            {/* 공휴일 인접 사용률 */}
                            {state.isComplete && state.holidayAdjacentUsageRate !== undefined && (
                                <Fade in timeout={1200}>
                                    <Box>
                                        <SubSectionTitle title="🎯 공휴일 인접 사용률" />
                                        <GradientCard padding={1.5}>
                                            <HolidayAdjacentUsageChart
                                                usageRate={state.holidayAdjacentUsageRate}
                                                isDarkTheme={isDark}
                                            />
                                        </GradientCard>
                                    </Box>
                                </Fade>
                            )}

                            {/* AI 분석 결과 (스트리밍 중) */}
                            {state.markdownBuffer && !state.isComplete && (
                                <Fade in timeout={500}>
                                    <Box>
                                        <SubSectionTitle title="💡 AI 분석 결과" />
                                        <GradientCard>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {normalizeLineBreaks(sanitizeMarkdown(state.markdownBuffer))}
                                            </ReactMarkdown>
                                        </GradientCard>
                                    </Box>
                                </Fade>
                            )}

                            {/* 경향 분석 요약 (완료 후) */}
                            {state.isComplete && state.finalResponseContents && extractAnalysisSummary(state.finalResponseContents) && (
                                <Fade in timeout={800}>
                                    <Box>
                                        <SubSectionTitle title="💡 경향 분석 요약" />
                                        <GradientCard>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {normalizeLineBreaks(extractAnalysisSummary(state.finalResponseContents) || '')}
                                            </ReactMarkdown>
                                        </GradientCard>
                                    </Box>
                                </Fade>
                            )}
                        </SectionCard>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* 영역 1.5: 팀 충돌 분석 */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {state.isComplete && state.finalResponseContents && extractTeamConflictAnalysis(state.finalResponseContents) && (
                            <Fade in timeout={1000}>
                                <Box>
                                    <SectionCard gradient={['#FF6B6B', '#EE5A6F']}>
                                        <SectionHeader
                                            icon={PeopleOutlineIcon}
                                            title="팀 충돌 분석"
                                            gradient="linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)"
                                        />
                                        <GradientCard>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {normalizeLineBreaks(extractTeamConflictAnalysis(state.finalResponseContents) || '')}
                                            </ReactMarkdown>
                                        </GradientCard>
                                    </SectionCard>
                                </Box>
                            </Fade>
                        )}

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* 영역 2: 추천 계획 */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {state.isComplete && (
                            <Fade in timeout={1200}>
                                <Box>
                                    <SectionCard gradient={['#10B981', '#059669']}>
                                        <SectionHeader
                                            icon={LightbulbOutlinedIcon}
                                            title="추천 계획"
                                            gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                        />

                                        {/* AI 추천 계획 상세 */}
                                        {state.finalResponseContents && (
                                            <Box sx={{ mb: 3 }}>
                                                <SubSectionTitle title="✨ AI 추천 계획 상세" />
                                                <Box
                                                    sx={{
                                                        p: 2.5,
                                                        bgcolor: isDark ? 'rgba(102, 126, 234, 0.05)' : '#F5F7FF',
                                                        borderRadius: '16px',
                                                        border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.2)' : '#E0E7FF'}`,
                                                    }}
                                                >
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {normalizeLineBreaks(sanitizeMarkdown(state.finalResponseContents))}
                                                    </ReactMarkdown>
                                                </Box>
                                            </Box>
                                        )}

                                        {/* 월별 연차 사용 분포 */}
                                        {Object.keys(state.monthlyDistribution).length > 0 && (
                                            <Box>
                                                <SubSectionTitle title="📈 월별 연차 사용 분포" />
                                                <GradientCard>
                                                    <MonthlyDistributionChart
                                                        monthlyData={state.monthlyDistribution}
                                                        isDarkTheme={isDark}
                                                    />
                                                </GradientCard>
                                            </Box>
                                        )}

                                        {/* 추천 휴가 날짜 캘린더 */}
                                        {state.recommendedDates.length > 0 && (
                                            <Box>
                                                <SubSectionTitle title="🗓️ 추천 휴가 날짜 캘린더" />
                                                <GradientCard>
                                                    <VacationCalendarGrid
                                                        recommendedDates={state.recommendedDates}
                                                        isDarkTheme={isDark}
                                                    />
                                                </GradientCard>
                                            </Box>
                                        )}

                                        {/* 주요 연속 휴가 기간 */}
                                        {state.consecutivePeriods.length > 0 && (
                                            <Box>
                                                <SubSectionTitle title="🏖️ 주요 연속 휴가 기간" />
                                                {state.consecutivePeriods.map((period, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            p: 2,
                                                            mb: 1.5,
                                                            bgcolor: isDark ? 'rgba(236, 72, 153, 0.05)' : '#FFF1F2',
                                                            borderRadius: '12px',
                                                            border: `1px solid ${isDark ? 'rgba(236, 72, 153, 0.2)' : '#FFE4E6'}`,
                                                            display: 'flex',
                                                            gap: 1.5,
                                                            alignItems: 'flex-start',
                                                        }}
                                                    >
                                                        <CalendarTodayIcon sx={{ color: '#EC4899', mt: 0.25, fontSize: 18 }} />
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                                    {`${period.startDate} ~ ${period.endDate}`}
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        px: 1,
                                                                        py: 0.25,
                                                                        bgcolor: '#EC4899',
                                                                        color: 'white',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {`${period.days}일`}
                                                                </Box>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: isDark ? '#9CA3AF' : '#6B7280',
                                                                    fontSize: '0.85rem',
                                                                }}
                                                            >
                                                                {period.description}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </SectionCard>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                )}
            </Box>

            {/* 하단 닫기 버튼 */}
            <Box sx={{ p: 3, pt: 2, textAlign: 'center' }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    fullWidth
                    sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        background: isDark
                            ? 'linear-gradient(135deg, #4A4A4A 0%, #3A3A3A 100%)'
                            : 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)',
                        color: isDark ? 'white' : '#1A1D29',
                        fontWeight: 600,
                        fontSize: '16px',
                        boxShadow: isDark
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${isDark ? 'rgba(80, 80, 80, 0.5)' : '#E0E0E0'}`,
                        '&:hover': {
                            background: isDark
                                ? 'linear-gradient(135deg, #555555 0%, #444444 100%)'
                                : 'linear-gradient(135deg, #EEEEEE 0%, #E5E5E5 100%)',
                        },
                    }}
                >
                    {state.isComplete ? '닫기' : '분석 중...'}
                </Button>
            </Box>
        </Dialog>
    );
};

export default VacationRecommendationModal;
