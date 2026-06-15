import type { MantineColorsTuple } from '@mantine/core';

const defaultColor: MantineColorsTuple = [
  '#ffe8f9', // 0
  '#ffcfeb', // 1
  '#ff9cd4', // 2
  '#fe65bc', // 3
  '#fd39a7', // 4
  '#fd1f9a', // 5
  '#eb0085', // 6 (기준 색상)
  '#e30080', // 7
  '#cb0072', // 8
  '#b20063', // 9
];
const blackColor: MantineColorsTuple = [
  '#f2f2f2',
  '#e6e6e6',
  '#cccccc',
  '#b3b3b3',
  '#999999',
  '#808080',
  '#666666',
  '#4d4d4d',
  '#333333',
  '#262626',
];

const grayColor: MantineColorsTuple = [
  '#f3f3f3',
  '#e7e7e7',
  '#cdcdcd',
  '#b2b2b2',
  '#9a9a9a',
  '#8b8b8b',
  '#262626',
  '#717171',
  '#656565',
  '#575757',
];

/**
 * button 관련해서 hover 에 대해서 재정의 하지 않음으로 모든 컬러 set 을 동일하게 가져간다.
 */
const buttonBlackColor: MantineColorsTuple = [
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
  '#333333',
];

const buttonWhiteColor: MantineColorsTuple = [
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
];

export { defaultColor, blackColor, grayColor, buttonBlackColor, buttonWhiteColor };
