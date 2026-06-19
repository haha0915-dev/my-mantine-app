'use client';

import { ReactNode, Suspense } from 'react';

import { Container } from '@mantine/core';

// import { CSLoadingOverlay } from '@/components';
// import { CSHeader, ProtectedPage } from '@/widgets';

const ETCLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => (
  <>
    {/* <Suspense fallback={<CSLoadingOverlay loading={true} />}>
      <ProtectedPage>
        <CSHeader />
        <Container w={'1014px'} maw={'1014px'} pt={'var(--cs-header-height)'} p={0} m={'auto'}>
          {children}
        </Container>
      </ProtectedPage>
    </Suspense> */}

    <Suspense >
        <Container w={'1014px'} maw={'1014px'} pt={'var(--cs-header-height)'} p={0} m={'auto'}>
          {children}
        </Container>
    </Suspense>

  </>
);

export default ETCLayout;
