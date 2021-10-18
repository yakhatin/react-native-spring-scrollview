/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-09-24 09:47:22
 * @LastEditTime: 2021-10-18 11:15:15
 * @LastEditors: 石破天惊
 * @Description:
 */

import React, { useRef, useState } from "react";
import { Animated, Platform, StyleSheet, ViewProps } from "react-native";
import {
  NativeViewGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  createNativeWrapper,
} from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { RefreshHeader } from "./RefreshHeader";
import { LoadingFooter } from "./LoadingFooter";
import { styles } from "./styles";

interface SpringScrollViewType {
  inverted?: boolean;
  bounces?: boolean | "vertical" | "horizontal";
  scrollEnabled?: boolean | "vertical" | "horizontal";
  directionalLockEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  pagingEnabled?: boolean;
  decelerationRate?: number;
  pageSize?: { width: number, height: number };
  refreshHeader?: RefreshHeader;
  loadingFooter?: LoadingFooter;
  refreshing?: boolean;
  loadingMore?: boolean;
}

export const SpringScrollView = React.forwardRef(
  (props: SpringScrollViewType, ref) => {
    const [sharedValues] = useState({
      size: { width: useSharedValue(0), height: useSharedValue(0) },
      contentSize: { width: useSharedValue(0), height: useSharedValue(0) },
      contentOffset: { x: useSharedValue(0), y: useSharedValue(0) },
      contentInsets: {
        top: useSharedValue(0),
        bottom: useSharedValue(0),
        left: useSharedValue(0),
        right: useSharedValue(0),
      },
      directionalLock: useSharedValue(true),
      draggingDirection: useSharedValue(""),
      vIndicatorOpacity: useSharedValue(0),
      hIndicatorOpacity: useSharedValue(0),
      refreshAnimating: useSharedValue(false),
      refreshHeaderRef: useRef(),
      refreshStatus: useSharedValue("waiting"),
      loadMoreAnimating: useSharedValue(false),
      loadMoreFooterRef: useRef(),
      loadMoreStatus: useSharedValue("waiting"),
      panRef: useRef(),
      focusing: useSharedValue(false),
    });
    return <SpringScrollViewClass ref={ref} {...props} {...sharedValues} />;
  }
);

SpringScrollView.defaultProps = {
  isSpringScrollView: true,
  inverted: false,
  bounces: "vertical",
  scrollEnabled: "vertical",
  directionalLockEnabled: true,
  showsVerticalScrollIndicator: true,
  showsHorizontalScrollIndicator: true,
  dragToHideKeyboard: true,
  pagingEnabled: false,
  decelerationRate: 0.998,
  pageSize: { width: 0, height: 0 },
  refreshHeader: RefreshHeader,
  loadingFooter: LoadingFooter,
  refreshing: false,
  loadingMore: false,
};

class SpringScrollViewClass extends React.Component<SpringScrollViewType> {
  render() {
    return <this.SpringScrollViewCore {...this.props} />;
  }

  SpringScrollViewCore = (props) => {
    const vBounces = props.bounces === true || props.bounces === "vertical";
    const hBounces = props.bounces === true || props.bounces === "horizontal";
    const vScroll =
      props.scrollEnabled === true || props.scrollEnabled === "vertical";
    const hScroll =
      props.scrollEnabled === true || props.scrollEnabled === "horizontal";
    const onSize = (e) => {
      props.size.width.value = e.nativeEvent.layout.width;
      props.size.height.value = e.nativeEvent.layout.height;
    };
    const onContentSize = (e) => {
      props.contentSize.width.value = e.nativeEvent.layout.width;
      props.contentSize.height.value = e.nativeEvent.layout.height;
    };

    const isOutOfTop = () => {
      "worklet";
      return (
        props.contentOffset.y.value <= -props.contentInsets.top.value + 0.1
      );
    };
    const isEnoughToRefresh = () => {
      "worklet";
      return (
        props.contentOffset.y.value <=
        -props.contentInsets.top.value - props.refreshHeader.height
      );
    };
    const isOutOfBottom = () => {
      "worklet";
      return (
        props.contentOffset.y.value >=
        props.contentSize.height.value - props.size.height.value
      );
    };
    const isEnoughToLoadMore = () => {
      "worklet";
      return (
        props.contentOffset.y.value >=
        -props.size.height.value +
          props.contentSize.height.value +
          props.loadingFooter.height
      );
    };
    const isOutOfLeft = () => {
      "worklet";
      return props.contentOffset.x.value <= -props.contentInsets.left.value;
    };
    const isOutOfRight = () => {
      "worklet";
      return (
        props.contentOffset.x.value >=
        props.contentInsets.right.value +
          props.contentSize.width.value -
          props.size.width.value
      );
    };
    const isOutOfHorizontal = () => {
      "worklet";
      return isOutOfLeft() || isOutOfRight();
    };
    const isOutOfVertical = () => {
      "worklet";
      return isOutOfTop() || isOutOfBottom();
    };

    const changeStateWrapper = (status) => {
      props.refreshHeaderRef.current?.changeToState(status);
    };
    const onLoadingMoreStateChange = (status) =>
      props.loadMoreFooterRef.current?.changeToState(status);

    const loadMoreStateWrapper = (status) => {
      props.loadMoreFooterRef.current?.changeToState(status);
    };

    const drag = (offset) => {
      "worklet";
      if (!hBounces) {
        const estX = props.contentOffset.x.value + offset.x;
        if (estX < -props.contentInsets.left.value) {
          offset.x =
            -props.contentInsets.left.value - props.contentOffset.x.value;
        } else if (
          estX >
          props.contentSize.width.value -
            props.size.width.value +
            props.contentInsets.right.value
        ) {
          offset.x =
            props.contentSize.width.value -
            props.size.width.value +
            props.contentInsets.right.value -
            props.contentOffset.x.value;
        }
      }
      if (!vBounces) {
        const estY = props.contentOffset.y.value + offset.y;
        if (estY < -props.contentInsets.top.value) {
          offset.y =
            -props.contentInsets.top.value - props.contentOffset.y.value;
        } else if (
          estY >
          props.contentSize.height.value -
            props.size.height.value +
            props.contentInsets.bottom.value
        ) {
          offset.y =
            props.contentSize.height.value -
            props.size.height.value +
            props.contentInsets.bottom.value -
            props.contentOffset.y.value;
        }
      }
      if (props.directionalLock.value) {
        if (!props.draggingDirection.value) {
          props.draggingDirection.value =
            Math.abs(offset.x) > Math.abs(offset.y) ? "h" : "v";
        }
        if (props.draggingDirection.value === "h") offset.y = 0;
        if (props.draggingDirection.value === "v") offset.x = 0;
      }
      if ((offset.x < 0 && isOutOfLeft()) || (offset.x > 0 && isOutOfRight())) {
        offset.x = offset.x * (-0.001 * Math.abs(offset.x) + 0.5);
      }
      if ((offset.y < 0 && isOutOfTop()) || (offset.y > 0 && isOutOfBottom())) {
        offset.y = offset.y * (-0.001 * Math.abs(offset.y) + 0.5);
      }
      props.contentOffset.x.value += offset.x;
      props.contentOffset.y.value += offset.y;
      let shouldChange = false;
      if (props.refreshStatus.value === "waiting" && isOutOfTop()) {
        props.refreshStatus.value = "pulling";
        shouldChange = true;
      } else if (
        (props.refreshStatus.value === "pulling" ||
          props.refreshStatus.value === "pullingCancel") &&
        props.contentOffset.y.value < -props.refreshHeader.height
      ) {
        props.refreshStatus.value = "pullingEnough";
        shouldChange = true;
      } else if (
        props.refreshStatus.value === "pullingEnough" &&
        props.contentOffset.y.value > -props.refreshHeader.height
      ) {
        props.refreshStatus.value = "pullingCancel";
        shouldChange = true;
      }
      // shouldChange && runOnJS(changeStateWrapper)(props.refreshStatus.value);
      shouldChange = false;
      if (props.loadMoreStatus.value === "waiting" && isOutOfBottom()) {
        props.loadMoreStatus.value = "dragging";
        shouldChange = true;
      } else if (
        (props.loadMoreStatus.value === "dragging" ||
          props.loadMoreStatus.value === "draggingCancel") &&
        props.contentOffset.y.value >
          props.contentSize.height.value -
            props.size.height.value +
            props.loadingFooter.height
      ) {
        props.loadMoreStatus.value = "draggingEnough";
        shouldChange = true;
      } else if (
        props.loadMoreStatus.value === "draggingEnough" &&
        props.contentOffset.y.value <
          props.contentSize.height.value -
            props.size.height.value +
            props.loadingFooter.height
      ) {
        props.loadMoreStatus.value = "draggingCancel";
        shouldChange = true;
      }
      // shouldChange &&
      // runOnJS(onLoadingMoreStateChange)(props.loadMoreStatus.value);
    };

    const shouldParentsFocus = () => {
      "worklet";
      return (
        props.focusing.value ||
        (props.parentFocus && props.shouldParentsFocus())
      );
    };

    const onActive = (evt, ctx) => {
      "worklet";
      if (Math.abs(evt.translationY) < 0.1 && Math.abs(evt.translationX) < 0.1)
        return false;
      let direction = "";
      if (Math.abs(evt.translationX) > Math.abs(evt.translationY)) {
        direction = evt.translationX > 0 ? "left" : "right";
      } else {
        direction = evt.translationY > 0 ? "up" : "down";
      }
      if (!props.scrollEnabled)
        return props.onParantPanActive && props.onParantPanActive(evt, ctx);
      if (!props.focusing.value) {
        if (props.shouldParentsFocus && props.shouldParentsFocus()) {
          return props.onParantPanActive && props.onParantPanActive(evt, ctx);
        }
        if (
          (direction === "up" && isOutOfTop()) ||
          (direction === "down" && isOutOfBottom()) ||
          (direction === "left" && isOutOfLeft()) ||
          (direction === "right" && isOutOfRight())
        ) {
          if (props.onParantPanActive && props.onParantPanActive(evt, ctx)) {
            return true;
          }
        }
      }
      if (!props.focusing.value) props.focusing.value = true;
      if (
        props.showsVerticalScrollIndicator &&
        props.size.height.value < props.contentSize.height.value
      )
        props.vIndicatorOpacity.value = 1;
      if (
        props.showsHorizontalScrollIndicator &&
        props.size.width.value < props.contentSize.width.value
      )
        props.hIndicatorOpacity.value = 1;
      const factor = props.inverted ? -1 : 1;
      drag({
        x: ctx.last.x - evt.absoluteX,
        y: factor * (ctx.last.y - evt.absoluteY),
      });
      ctx.last = { x: evt.absoluteX, y: evt.absoluteY };
      return true;
    };
    const onEnd = (evt) => {
      "worklet";
      if (!props.focusing.value)
        return props.onParentPanEnd && props.onParentPanEnd(evt);
      if (!props.scrollEnabled) return;
      const maxX =
        props.contentSize.width.value -
        props.size.width.value +
        props.contentInsets.right.value;
      let maxY =
        props.contentSize.height.value +
        props.contentInsets.bottom.value -
        props.size.height.value;
      const vx = props.draggingDirection.value === "v" ? 0 : -evt.velocityX;
      const vy =
        evt.velocityY *
        (props.inverted ? 1 : -1) *
        (props.draggingDirection.value === "h" ? 0 : 1);
      if (hScroll) {
        if (hBounces && isOutOfHorizontal()) {
          props.contentOffset.x.value = withSpring(
            isOutOfLeft() ? -props.contentInsets.left.value : maxX,
            {
              velocity: vx,
              damping: 30,
              mass: 1,
              stiffness: 225,
            },
            (isFinish) => {
              if (isFinish) {
                props.focusing.value = false;
                props.hIndicatorOpacity.value = withDelay(1000, withTiming(0));
              }
            }
          );
        } else {
          props.contentOffset.x.value = withDecay(
            {
              velocity: vx,
              deceleration: props.decelerationRate,
              clamp: [0, maxX],
            },
            (isFinish) => {
              if (!isFinish) return;
              if (hBounces) {
                props.contentOffset.x.value = withSpring(
                  props.contentOffset.x.value + 0.01,
                  {
                    velocity: vx,
                    damping: 48,
                    mass: 2.56,
                    stiffness: 225,
                  },
                  (isFinish) => {
                    if (isFinish) {
                      props.focusing.value = false;
                      props.hIndicatorOpacity.value = withDelay(
                        1000,
                        withTiming(0)
                      );
                    }
                  }
                );
              } else {
                props.focusing.value = false;
                props.hIndicatorOpacity.value = withDelay(1000, withTiming(0));
              }
            }
          );
        }
      }
      if (vScroll) {
        if (vBounces && isOutOfVertical()) {
          if (
            props.onRefresh &&
            props.refreshStatus.value === "pullingEnough"
          ) {
            props.contentInsets.top.value = props.refreshHeader.height;
            props.refreshAnimating.value = true;
            runOnJS(props.onRefresh)();
          }
          if (
            props.onLoadingMore &&
            props.loadMoreStatus.value === "draggingEnough"
          ) {
            props.contentInsets.bottom.value = props.loadingFooter.height;
            props.loadMoreAnimating.value = true;
            maxY += props.loadingFooter.height;
            runOnJS(props.onLoadingMore)();
          }

          props.contentOffset.y.value = withSpring(
            isOutOfTop() ? -props.contentInsets.top.value : maxY,
            {
              velocity: vy,
              damping: 30,
              mass: 1,
              stiffness: 225,
            },
            (isFinish) => {
              if (isFinish) {
                props.focusing.value = false;
                props.vIndicatorOpacity.value = withDelay(1000, withTiming(0));
                props.refreshAnimating.value = false;
                props.loadMoreAnimating.value = false;
              }
            }
          );
        } else {
          props.contentOffset.y.value = withDecay(
            {
              velocity: vy,
              deceleration: props.decelerationRate,
              clamp: [-props.contentInsets.top.value, maxY],
            },
            (isFinish) => {
              if (!isFinish) return;
              if (vBounces) {
                props.contentOffset.y.value = withSpring(
                  props.contentOffset.y.value + 0.01,
                  {
                    velocity: vy,
                    damping: 48,
                    mass: 2.56,
                    stiffness: 225,
                  },
                  (isFinish) => {
                    if (isFinish) {
                      props.focusing.value = false;
                      props.vIndicatorOpacity.value = withDelay(
                        1000,
                        withTiming(0)
                      );
                    }
                  }
                );
              } else {
                props.focusing.value = false;
                props.vIndicatorOpacity.value = withDelay(1000, withTiming(0));
              }
            }
          );
        }
      }
      return true;
    };

    const panHandler = useAnimatedGestureHandler({
      onStart: (evt, ctx) =>
        (ctx.last = { x: evt.absoluteX, y: evt.absoluteY }),
      onActive,
      onEnd,
    });
    const touchHandler = {
      onTouchStart: () => {
        // console.log("onTouchStart");
        props.draggingDirection.value = "";
        cancelAnimation(props.contentOffset.x);
        cancelAnimation(props.contentOffset.y);
        cancelAnimation(props.vIndicatorOpacity);
        cancelAnimation(props.hIndicatorOpacity);
      },
      onTouchEnd: () => {
        // console.log("onTouchEnd");
        props.vIndicatorOpacity.value = withDelay(2000, withTiming(0));
        props.hIndicatorOpacity.value = withDelay(2000, withTiming(0));
      },
      onTouchCancel: () => {
        // console.log("onTouchCancel");
      },
    };
    const containerStyle = useAnimatedStyle(() => {
      return {
        flex: 1,
        overflow: Platform.OS === "ios" ? "scroll" : "hidden",
        transform: [{ scaleY: props.inverted ? -1 : 1 }],
      };
    });
    const contentContainerStyle = useAnimatedStyle(() => {
      return {
        flexGrow: 1,
        transform: [
          { translateX: -props.contentOffset.x.value },
          { translateY: -props.contentOffset.y.value },
        ],
      };
    });
    const vIndicatorStyle = useAnimatedStyle(() => {
      return {
        opacity: props.vIndicatorOpacity.value,
        height: props.contentSize.height.value
          ? (props.size.height.value * props.size.height.value) /
              props.contentSize.height.value -
            6
          : props.contentSize.height.value,
        transform: [
          {
            translateY: props.contentSize.height.value
              ? (props.contentOffset.y.value * props.size.height.value) /
                props.contentSize.height.value
              : 0,
          },
        ],
      };
    });
    const hIndicatorStyle = useAnimatedStyle(() => {
      return {
        opacity: props.hIndicatorOpacity.value,
        width: props.contentSize.width.value
          ? (props.size.width.value * props.size.width.value) /
              props.contentSize.width.value -
            6
          : props.contentSize.width.value,
        transform: [
          {
            translateX: props.contentSize.width.value
              ? (props.contentOffset.x.value * props.size.width.value) /
                props.contentSize.width.value
              : 0,
          },
        ],
      };
    });
    const refreshHeaderStyle = useAnimatedStyle(() => {
      return {
        left: 0,
        right: 0,
        position: "absolute",
        top: -props.refreshHeader.height,
        height: props.refreshHeader.height,
        transform: [{ translateY: -props.contentOffset.y.value }],
      };
    });
    const loadMoreFooterStyle = useAnimatedStyle(() => {
      let translateY =
        props.contentSize.height.value -
        props.size.height.value -
        props.contentOffset.y.value;
      return {
        left: 0,
        right: 0,
        position: "absolute",
        bottom: -props.loadingFooter.height,
        height: props.loadingFooter.height,
        transform: [{ translateY }],
      };
    });
    const nestedRefs = props.nestedRefs ? props.nestedRefs : [];
    if (nestedRefs.indexOf(props.panRef) < 0) nestedRefs.push(props.panRef);
    const map = (children) => {
      return React.Children.map(children, (child) => {
        if (child?.props?.isSpringScrollView) {
          if (child?.props?.onParantPanActive) return child;
          return React.cloneElement(child, {
            nestedRefs,
            onParantPanActive: onActive,
            onParentPanEnd: onEnd,
            shouldParentsFocus,
          });
        }
        if (child.props?.children) {
          return React.cloneElement(
            child,
            undefined,
            map(child.props.children)
          );
        }
        return child;
      });
    };
    const children = map(props.children);
    return (
      <PanGestureHandler ref={props.panRef} onGestureEvent={panHandler}>
        <Reanimated.View
          {...props}
          style={[containerStyle, props.style]}
          onLayout={onSize}
          {...touchHandler}
        >
          {props.onRefresh && (
            <Reanimated.View style={refreshHeaderStyle}>
              <props.refreshHeader ref={props.refreshHeaderRef} />
            </Reanimated.View>
          )}
          {props.onLoadingMore && (
            <Reanimated.View style={loadMoreFooterStyle}>
              <props.loadingFooter ref={props.loadMoreFooterRef} />
            </Reanimated.View>
          )}
          <Reanimated.View
            onLayout={onContentSize}
            style={[contentContainerStyle, props.contentContainerStyle]}
          >
            {children}
          </Reanimated.View>
          <Reanimated.View style={[styles.hIndicator, hIndicatorStyle]} />
          <Reanimated.View style={[styles.vIndicator, vIndicatorStyle]} />
        </Reanimated.View>
      </PanGestureHandler>
    );
  };

  shouldComponentUpdate(next) {
    const {
      size,
      contentSize,
      contentOffset,
      contentInsets,
      refreshing,
      refreshHeader,
      refreshAnimating,
      refreshStatus,
      refreshHeaderRef,
      loadingMore,
      loadingFooter,
      loadMoreAnimating,
      loadMoreStatus,
      loadMoreFooterRef,
      hIndicatorOpacity,
      vIndicatorOpacity,
      directionalLock,
      directionalLockEnabled,
    } = this.props;
    if (!next.showsHorizontalScrollIndicator) {
      cancelAnimation(hIndicatorOpacity);
      hIndicatorOpacity.value = 0;
    }
    if (!next.showsVerticalScrollIndicator) {
      cancelAnimation(vIndicatorOpacity);
      vIndicatorOpacity.value = 0;
    }
    directionalLock.value = directionalLockEnabled;
    if (refreshing !== next.refreshing) {
      if (next.refreshing) {
        refreshAnimating.value = true;
        refreshStatus.value = "refreshing";
        refreshHeaderRef.current?.changeToState("refreshing");
      } else {
        refreshStatus.value = "rebound";
        refreshHeaderRef.current?.changeToState("rebound");
      }
      if (!refreshAnimating.value) {
        const reboundCallback = () =>
          refreshHeaderRef.current?.changeToState("waiting");
        cancelAnimation(contentOffset.y);
        const to = next.refreshing ? refreshHeader.height : 0;
        contentInsets.top.value = to;
        contentOffset.y.value = withSpring(
          -to,
          {
            velocity: -10,
            damping: 30,
            mass: 1,
            stiffness: 225,
          },
          (isFinish) => {
            if (refreshStatus.value === "refreshing") {
              refreshAnimating.value = false;
            } else {
              refreshStatus.value = "waiting";
              runOnJS(reboundCallback)();
            }
          }
        );
      }
    }
    if (loadingMore !== next.loadingMore) {
      if (next.loadingMore) {
        contentInsets.bottom.value = loadingFooter.height;
        loadMoreAnimating.value = true;
        loadMoreStatus.value = "loading";
        loadMoreFooterRef.current?.changeToState("loading");
      } else {
        contentInsets.bottom.value = 0;
        loadMoreStatus.value = "rebound";
        loadMoreFooterRef.current?.changeToState("rebound");
      }
      if (!loadMoreAnimating.value) {
        const reboundCallback = () =>
          loadMoreFooterRef.current?.changeToState("waiting");
        cancelAnimation(contentOffset.y);
        const to =
          contentSize.height.value -
          size.height.value +
          (next.loadingMore ? loadingFooter.height : 0);

        contentOffset.y.value = withSpring(
          to,
          {
            velocity: 10,
            damping: 30,
            mass: 1,
            stiffness: 225,
          },
          (isFinish) => {
            if (loadMoreStatus.value === "loading") {
              loadMoreAnimating.value = false;
            } else {
              loadMoreStatus.value = "waiting";
              runOnJS(reboundCallback)();
            }
          }
        );
      }
    }
    return !next.preventReRender;
  }
}
