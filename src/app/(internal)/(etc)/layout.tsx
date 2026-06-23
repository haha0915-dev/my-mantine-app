'use client';

import { ReactNode, Suspense } from 'react';

import { Container } from '@mantine/core';
import ProtectedPage from '@/widgets/components/ProtectedPage/ProtectedPage';

// import { CSLoadingOverlay } from '@/components';
// import { CSHeader, ProtectedPage } from '@/widgets';

const ETCLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => (
  <>
    <Suspense >
      <ProtectedPage>
        <Container w={'1014px'} maw={'1014px'} pt={'var(--cs-header-height)'} p={0} m={'auto'}>
          {children}
        </Container>
      </ProtectedPage>
    </Suspense>

  </>
);

export default ETCLayout;
