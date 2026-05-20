import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screen = {
  width,
  height,
  isSmall: width < 360,
  isMedium: width >= 360 && width < 768,
  isLarge: width >= 768,
  isWeb: Platform.OS === 'web'
};

export function wp(percent: number) {
  return (width * percent) / 100;
}

export function hp(percent: number) {
  return (height * percent) / 100;
}

export function responsiveFont(size: number) {
  if (screen.isSmall) return size - 2;
  if (screen.isLarge) return size + 2;
  return size;
}

export function responsivePadding() {
  if (screen.isLarge) return 28;
  if (screen.isSmall) return 14;
  return 18;
}

export function contentMaxWidth() {
  return screen.isLarge ? 560 : '100%';
}
