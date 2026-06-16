'use client';

import { ReactNode } from 'react';

import { Container } from '@mantine/core';

const LoginLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => (
  <>
    <Container w={'1014px'} maw={'1014px'} p={0} m={'auto'}>
      {children}
    </Container>
  </>
);

export default LoginLayout;
