import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  ImageBackground,
} from 'react-native';
import spacing from '../theme/spacing';
import colors from '../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  background?: any; // require('../assets/images/…')
  style?: ViewStyle;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  background,
  style,
}) => {
  if (background) {
    return (
      <ImageBackground source={background} style={[styles.image, style]}>
        {children}
      </ImageBackground>
    );
  }
  return <SafeAreaView style={[styles.safe, style]}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    paddingHorizontal: spacing.lg,
  },
});

export default ScreenContainer;
