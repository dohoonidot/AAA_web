import { useState } from 'react';
import authService from '../../services/authService';
import type { FormEvent, KeyboardEvent } from 'react';

export const useLoginFormState = ({
  onLoginSuccess,
  navigate,
}: {
  onLoginSuccess: () => void;
  navigate: (path: string) => void;
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeDialogOpen, setPasswordChangeDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ user_id: userId, password });

      console.log('🔐 [LoginForm] 로그인 응답:', response);
      console.log('🔐 [LoginForm] is_approver:', response.is_approver);

      if (response.status_code === 200) {
        if (response.is_agreed === 0) {
          setPendingUserId(userId);
          setPrivacyDialogOpen(true);
        } else {
          navigate('/chat');
          onLoginSuccess();
        }
      } else {
        setError('로그인에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyAgreed = () => {
    setPrivacyDialogOpen(false);
    setPendingUserId('');
    navigate('/chat');
    onLoginSuccess();
  };

  const handlePrivacyDisagreed = async () => {
    setPrivacyDialogOpen(false);
    setPendingUserId('');
    sessionStorage.setItem('privacy_disagree_dismissed', '1');
    navigate('/chat');
    onLoginSuccess();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return {
    state: {
      userId,
      password,
      error,
      loading,
      showPassword,
      passwordChangeDialogOpen,
      privacyDialogOpen,
      pendingUserId,
    },
    actions: {
      setUserId,
      setPassword,
      setError,
      setLoading,
      setShowPassword,
      setPasswordChangeDialogOpen,
      setPrivacyDialogOpen,
      setPendingUserId,
      handleSubmit,
      handlePrivacyAgreed,
      handlePrivacyDisagreed,
      handleKeyPress,
    },
  };
};

export type LoginFormStateHook = ReturnType<typeof useLoginFormState>;
