// src/app/page.tsx
import { Button, Group, Container, Title } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="md">Mantine이 정상적으로 설치되었습니다!</Title>

      <Group>
        <Button variant="filled">Filled 버튼</Button>
        <Button variant="light" color="red">Light 버튼</Button>
        <Button variant="outline" color="grape">Outline 버튼</Button>
      </Group>
    </Container>
  );
}