import { useState, type FormEvent } from 'react';

import { Button, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core';

import { useMainStore } from '@/providers';
import type { ILoginProps } from '@/types/domain/login';

const TEST_ACCOUNT = {
  id: 'test-001',
  name: '테스트 사용자',
  loginId: 'test',
  employeeNumber: 'EMP001',
  isRegularEmployee: true,
};

const Login = () => {
  const setAccount = useMainStore((state) => state.setAccount);
  const [form, setForm] = useState<ILoginProps>({
    loginId: '',
    loginPw: '',
  });

  const handleChangeLoginId = (value: string) => {
    setForm((prev) => ({ ...prev, loginId: value }));
  };

  const handleChangeLoginPw = (value: string) => {
    setForm((prev) => ({ ...prev, loginPw: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccount({ ...TEST_ACCOUNT, loginId: form.loginId || TEST_ACCOUNT.loginId });
  };

  

  return (
    <Paper withBorder radius="md" p="xl" shadow="sm">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={2}>로그인</Title>

          <TextInput
            label="로그인 ID"
            placeholder="로그인 ID를 입력하세요"
            value={form.loginId}
            onChange={(event) => handleChangeLoginId(event.target.value)}
            autoComplete="username"
            required
          />

          <PasswordInput
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={form.loginPw}
            onChange={(event) => handleChangeLoginPw(event.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" fullWidth>
            로그인
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default Login;
