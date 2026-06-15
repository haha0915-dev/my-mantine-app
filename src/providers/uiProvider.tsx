import React, { ReactNode } from 'react';

import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { blackColor, buttonBlackColor, buttonWhiteColor, defaultColor, grayColor } from '@/assets/data';
import { NOTIFICATION_Z_INDEX } from '@/constants';

const theme = createTheme({
  primaryColor: 'default',
  fontFamily: 'Pretendard, Arial, Helvetica, sans-serif',
  colors: {
    default: defaultColor,
    black: blackColor,
    gray: grayColor,
    buttonBlack: buttonBlackColor,
    buttonWhite: buttonWhiteColor,
  },
  headings: {
    sizes: {
      h4: {
        fontWeight: '600',
        lineHeight: '1.4',
        fontSize: '1rem',
      },
    },
  },
  components: {
    // Container: {
    //   defaultProps: {
    //     // size: 'xl', // 또는 원하는 크기
    //   },
    //   styles: {
    //     root: {
    //       '--container-size': '1180px',
    //     },
    //   },
    // },
  },
});

export const UIProvider = ({ children }: { children: ReactNode }) => (
  <MantineProvider theme={theme}>
    <Notifications zIndex={NOTIFICATION_Z_INDEX} />
    {children}
  </MantineProvider>
);
