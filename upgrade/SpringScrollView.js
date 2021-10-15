/*
 * @Author: 石破天惊
 * @email: shanshang130@gmail.com
 * @Date: 2021-09-24 09:47:22
 * @LastEditTime: 2021-10-14 12:08:03
 * @LastEditors: 石破天惊
 * @Description:
 */

import React, { useRef, useState } from "react";
import { Platform, StyleSheet, ViewProps } from "react-native";
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
import { RefreshHeader, LoadingFooter } from "../src";
import { styles } from "./styles";

export const SpringScrollView = React.forwardRef((props, ref) => {
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
    directionalLockEnabled: useSharedValue(true),
    draggingDirection: useSharedValue(""),
    vIndicatorOpacity: useSharedValue(0),
    hIndicatorOpacity: useSharedValue(0),
    refreshAnimating: useSharedValue(false),
    refreshHeaderRef: useRef(),
    refreshStatus: useSharedValue("waiting"),
  });
  return <SpringScrollViewClass ref={ref} {...props} {...sharedValues} />;
});

class SpringScrollViewClass extends React.Component {
  render() {
    return <this.SpringScrollViewCore {...this.props} />;
  }

  SpringScrollViewCore = (props) => {
    const vBounces = props.bounces === true || props.bounces === "vertical";
    const hBounces = props.bounces === true || props.bounces === "horizontal";

    if (!props.showsHorizontalScrollIndicator)
      props.hIndicatorOpacity.value = 0;
    if (!props.showsVerticalScrollIndicator) props.vIndicatorOpacity.value = 0;

    props.directionalLockEnabled.value = props.directionalLockEnabled;
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
      return props.contentOffset.y.value < -props.contentInsets.top.value;
    };
    const isEnoughToRefresh = () => {
      "worklet";
      return (
        props.contentOffset.y.value <
        -props.contentInsets.top.value - props.refreshHeader.height
      );
    };
    const isOutOfBottom = () => {
      "worklet";
      return (
        props.contentOffset.y.value >
        props.contentSize.height.value - props.size.height.value
      );
    };
    const isEnoughToLoadMore = () => {
      "worklet";
      return (
        props.contentOffset.y.value >
        -props.size.height.value +
          props.contentSize.height.value +
          props.loadingFooter.height
      );
    };
    const isOutOfLeft = () => {
      "worklet";
      return props.contentOffset.x.value < -props.contentInsets.left.value;
    };
    const isOutOfRight = () => {
      "worklet";
      return (
        props.contentOffset.x.value >
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

    const drag = (offset) => {
      "worklet";
      if (props.bounces === false || props.bounces === "vertical") {
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
      if (props.bounces === false || props.bounces === "horizontal") {
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
      if (props.directionalLockEnabled.value) {
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
      if (props.refreshStatus.value === "waiting" && isOutOfTop()) {
        props.refreshStatus.value = "pulling";
      } else if (
        (props.refreshStatus.value === "pulling" ||
          props.refreshStatus.value === "pullingCancel") &&
        props.contentOffset.y.value < -props.refreshHeader.height
      ) {
        props.refreshStatus.value = "pullingEnough";
      } else if (
        props.refreshStatus.value === "pullingEnough" &&
        props.contentOffset.y.value > -props.refreshHeader.height
      ) {
        props.refreshStatus.value = "pullingCancel";
      }
      runOnJS(changeStateWrapper)(props.refreshStatus.value);
    };

    const panHandler = useAnimatedGestureHandler({
      onStart: (evt, ctx) =>
        (ctx.last = { x: evt.absoluteX, y: evt.absoluteY }),
      onActive: (evt, ctx) => {
        if (!props.scrollEnabled) return;
        if (
          props.showsVerticalScrollIndicator &&
          props.size.height.value <
            props.contentSize.height.value +
              props.contentInsets.top.value +
              props.contentInsets.bottom.value
        )
          props.vIndicatorOpacity.value = 1;
        if (
          props.showsHorizontalScrollIndicator &&
          props.size.width.value <
            props.contentSize.width.value +
              props.contentInsets.left.value +
              props.contentInsets.right.value
        )
          props.hIndicatorOpacity.value = 1;
        const factor = props.inverted ? -1 : 1;
        drag({
          x: ctx.last.x - evt.absoluteX,
          y: factor * (ctx.last.y - evt.absoluteY),
        });
        ctx.last = { x: evt.absoluteX, y: evt.absoluteY };
      },
      onEnd: (evt) => {
        if (!props.scrollEnabled) return;
        const maxX =
          props.contentSize.width.value -
          props.size.width.value +
          props.contentInsets.right.value;
        const maxY =
          props.contentSize.height.value +
          props.contentInsets.bottom.value -
          props.size.height.value;
        const vx = props.draggingDirection.value === "v" ? 0 : -evt.velocityX;
        const vy =
          evt.velocityY *
          (props.inverted ? 1 : -1) *
          (props.draggingDirection.value === "h" ? 0 : 1);

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
              if (isFinish)
                props.hIndicatorOpacity.value = withDelay(1000, withTiming(0));
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
                    if (isFinish)
                      props.hIndicatorOpacity.value = withDelay(
                        1000,
                        withTiming(0)
                      );
                  }
                );
              } else {
                props.hIndicatorOpacity.value = withDelay(1000, withTiming(0));
              }
            }
          );
        }
        if (vBounces && isOutOfVertical()) {
          if (
            props.onRefresh &&
            props.refreshStatus.value === "pullingEnough"
          ) {
            props.contentInsets.top.value = props.refreshHeader.height;
            this.props.refreshAnimating.value = true;
            runOnJS(props.onRefresh)();
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
                props.vIndicatorOpacity.value = withDelay(1000, withTiming(0));
                this.props.refreshAnimating.value = false;
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
                    if (isFinish)
                      props.vIndicatorOpacity.value = withDelay(
                        1000,
                        withTiming(0)
                      );
                  }
                );
              } else {
                props.vIndicatorOpacity.value = withDelay(1000, withTiming(0));
              }
            }
          );
        }
      },
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
    return (
      <PanGestureHandler onGestureEvent={panHandler}>
        <Reanimated.View
          {...props}
          style={[containerStyle, props.style]}
          onLayout={onSize}
          {...touchHandler}
        >
          <Reanimated.View style={refreshHeaderStyle}>
            <props.refreshHeader ref={props.refreshHeaderRef} />
          </Reanimated.View>
          <Reanimated.View
            onLayout={onContentSize}
            style={[contentContainerStyle, props.contentContainerStyle]}
          >
            {props.children}
          </Reanimated.View>
          <Reanimated.View style={[styles.hIndicator, hIndicatorStyle]} />
          <Reanimated.View style={[styles.vIndicator, vIndicatorStyle]} />
        </Reanimated.View>
      </PanGestureHandler>
    );
  };

  shouldComponentUpdate(nextProps) {
    if (this.props.refreshing !== nextProps.refreshing) {
      if (nextProps.refreshing) {
        this.props.refreshAnimating.value = true;
        this.props.refreshStatus.value = "refreshing";
        this.props.refreshHeaderRef.current?.changeToState("refreshing");
      } else {
        this.props.refreshStatus.value = "rebound";
        this.props.refreshHeaderRef.current?.changeToState("rebound");
      }
      if (!this.props.refreshAnimating.value) {
        const reboundCallback = () =>
          this.props.refreshHeaderRef.current?.changeToState("waiting");
        cancelAnimation(this.props.contentOffset.y);
        const to = nextProps.refreshing ? this.props.refreshHeader.height : 0;
        this.props.contentInsets.top.value = to;
        this.props.contentOffset.y.value = withSpring(
          -to,
          {
            velocity: -10,
            damping: 30,
            mass: 1,
            stiffness: 225,
          },
          (isFinish) => {
            if (this.props.refreshStatus.value === "refreshing") {
              this.props.refreshAnimating.value = false;
            } else {
              this.props.refreshStatus.value = "waiting";
              runOnJS(reboundCallback)();
            }
          }
        );
      }
    }
    return !nextProps.preventReRender;
  }

  static defaultProps = {
    inverted: false,
    bounces: true,
    scrollEnabled: true,
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
  };
}
