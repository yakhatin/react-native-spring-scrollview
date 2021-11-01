/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-07-21 13:05:32
 * @LastEditTime: 2021-07-29 23:34:45
 * @LastEditors: 石破天惊
 * @Description: 
 */

import {Animated, ViewProps, ViewStyle} from 'react-native';
import {RefreshHeader} from './RefreshHeader';
import {LoadingFooter} from './LoadingFooter';

export interface IndexPath {
  section: number;
  row: number;
}

export interface Offset {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NativeContentOffset {
  x?: Animated.Value;
  y?: Animated.Value;
}

export type RefreshStyle = 'topping' | 'stickyScrollView' | 'stickyContent';

export type LoadingStyle = 'bottoming' | 'stickyScrollView' | 'stickyContent';

export interface ScrollEvent {
  nativeEvent: {
    contentOffset: {
      x: number,
      y: number,
    },
  };
}

export interface SpringScrollViewPropType extends ViewProps {
  contentContainerStyle?: ViewStyle;
  inverted?: boolean;
  bounces?: boolean | "vertical" | "horizontal";
  scrollEnabled?: boolean | "vertical" | "horizontal";
  directionalLockEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  pagingEnabled?: null | undefined | "vertical" | "horizontal";
  decelerationRate?: number;
  pageSize?: { width: number, height: number };
  refreshHeader?: RefreshHeader;
  loadingFooter?: LoadingFooter;
  refreshing?: boolean;
  allLoaded?: boolean;
  loadingMore?: boolean;
  preventReRender?: boolean;
  onScroll?: (contentOffset: {
    x: number,
    y: number,
  }) => any;
  onScrollUI?: (contentOffset: {
    x: Reanimated.SharedValue,
    y: Reanimated.SharedValue,
  }) => any;
  onSizeChange?: ({ width: number, height: number }) => any;
  onContentSizeChange?: ({ width: number, height: number }) => any;
  onTouchBegin?: () => any;
  onTouchEnd?: () => any;
  onScrollBeginDrag?: () => any;
  onScrollEndDrag?: () => any;
  textInputRefs?: TextInput[];
  inputToolBarHeight?: number;
  dragToHideKeyboard?: boolean;
  tapToHideKeyboard?: boolean;
  predefinedContentSize?: {
    height?: number;
    width: number;
  }
}
