import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { ThemeColors } from "../utils/Color";
import { radius } from "../utils/tokens";

const SPRING = { damping: 22, stiffness: 220, mass: 0.9 } as const;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of window height the sheet may grow to at most. */
  maxHeightRatio?: number;
  /** Hides the drag handle and disables drag-to-dismiss. */
  hideHandle?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Lifts the sheet above the keyboard. A RN `Modal` is its own native
   * window, so `KeyboardAvoidingView` in the tree behind it can't see it —
   * this drives the lift from the keyboard's own show/hide events instead.
   */
  avoidKeyboard?: boolean;
  accessibilityLabel?: string;
};

/**
 * Gesture-driven bottom sheet: spring open, drag-to-dismiss from the handle,
 * blurred/dimmed backdrop on iOS (flat dim elsewhere — `expo-blur` is
 * unsupported/inconsistent off-iOS, see DESIGN.md Materials). The single
 * sheet primitive every picker/modal in the app is built on.
 */
const BottomSheet = ({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.88,
  hideHandle,
  contentContainerStyle,
  avoidKeyboard = true,
  accessibilityLabel,
}: BottomSheetProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetHeight = useRef(windowHeight);

  const translateY = useSharedValue(windowHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSpring(0, SPRING);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else if (mounted) {
      translateY.value = withTiming(sheetHeight.current + 40, { duration: 220 });
      backdropOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!avoidKeyboard || !mounted) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates?.height ?? 0)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [avoidKeyboard, mounted]);

  const requestClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(requestClose)();
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) {
    return null;
  }

  const maxHeight = windowHeight * maxHeightRatio - keyboardHeight;

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={40}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        </Animated.View>

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityLabel="Close"
        />

        <Animated.View
          onLayout={(e) => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.sheet,
            { maxHeight, paddingBottom: insets.bottom + 12 },
            sheetStyle,
          ]}
        >
          {!hideHandle && (
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleArea}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>
          )}
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    scrim: {
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      ...elevationSheet,
      shadowColor: "#000000",
    },
    handleArea: {
      alignItems: "center",
      paddingVertical: 10,
    },
    handle: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    content: {
      flexShrink: 1,
    },
  });

const elevationSheet = {
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 8,
} as const;

export default BottomSheet;
