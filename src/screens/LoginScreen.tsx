import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent, TextInput as RNTextInput } from "react-native";
import Animated, {
  Easing,
  interpolate,
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Text from "../components/Text";
import TextInput from "../components/TextInput";
import { getFamilyByCode } from "../../database/query";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { FamilyModel } from "../models/FamilyModel";
import {
  LAST_FAMILY_KEY,
  rememberFamily,
  signInWithCredentials,
} from "../utils/auth";
import { useRouter } from "expo-router";
import { ThemeColors } from "../utils/Color";
import { elevation, radius } from "../utils/tokens";
import { showToast } from "../utils/Utils";

type FocusField = "family" | "username" | "password" | null;

// Brand lockup geometry, shared between the stylesheet and the keyboard
// animation math below so the two stay in sync.
const LOGO_SIZE = 72;
const TITLE_LINE_HEIGHT = 34;
const BRAND_ROW_GAP = 12; // horizontal gap between logo and title once compact
const BRAND_STACK_GAP = 18; // vertical gap between logo and title at rest
const STACK_HEIGHT = LOGO_SIZE + BRAND_STACK_GAP + TITLE_LINE_HEIGHT;
const ROW_HEIGHT = LOGO_SIZE;
// Rest-state (keyboard closed) vertical offset that separates the logo and
// title within the row container — see the comment above brandRowAnimatedStyle.
const LOGO_REST_Y = -(STACK_HEIGHT - LOGO_SIZE) / 2;
const TITLE_REST_Y = (STACK_HEIGHT - TITLE_LINE_HEIGHT) / 2;
// Best-guess width for "AssetDiary" before its first onLayout measurement,
// so the very first frame doesn't render off-center.
const DEFAULT_TITLE_WIDTH = 150;

const LoginScreen = () => {
  const router = useRouter();
  const [familyCode, setFamilyCode] = useState("");
  // The resolved family for the typed code. `notFound` distinguishes "haven't
  // looked up yet" (null + false) from "looked up, nothing there" (null + true).
  const [family, setFamily] = useState<FamilyModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  // Collapse the Family ID field once we know a family from a previous login;
  // a "Change" link re-opens it.
  const [showFamilyField, setShowFamilyField] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusField>(null);

  const usernameRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // useAnimatedKeyboard tracks the native keyboard frame as a UI-thread
  // shared value, so anything driven off it stays frame-synced with the
  // real keyboard animation instead of trailing a JS-thread timer.
  // (It's deprecated in favor of react-native-keyboard-controller upstream,
  // but that's a native module this app doesn't have installed yet; this
  // still works and needs no native changes.)
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });

  // Push the whole form up by the keyboard's height, pixel-synced every
  // frame — this is what keeps the card (Login button included) scrolled
  // above the keyboard instead of hidden behind it. Also turning off the
  // ScrollView's own `automaticallyAdjustKeyboardInsets` (below) so this is
  // the *only* thing driving keyboard avoidance — leaving both on had them
  // fighting each other on every focus change (family -> username ->
  // password), which read as a glitch/jump.
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  // Morph the brand block from a centered logo-over-title stack into a
  // compact logo-beside-title row pinned near the top, freeing up vertical
  // space for the card below. Both the logo and title are laid out in a
  // normal flex row (so their compact, keyboard-open position falls out of
  // ordinary flow — no transform needed there); at rest we pull them apart
  // into the stacked look with translateX/Y so no separate rest-state layout
  // is needed. Driven off the keyboard's open/closed *state* (not its raw,
  // sometimes-jittery height) through a fixed, custom-eased timing so the
  // jump-and-slide always feels like one deliberate motion, matching pace
  // with the keyboard without being a literal pixel-for-pixel mirror of it.
  const brandProgress = useSharedValue(0);
  useAnimatedReaction(
    () => keyboard.state.value,
    (state, previousState) => {
      if (state === previousState) return;
      const open = state === KeyboardState.OPEN || state === KeyboardState.OPENING;
      brandProgress.value = withTiming(open ? 1 : 0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  );

  const [titleWidth, setTitleWidth] = useState(DEFAULT_TITLE_WIDTH);
  const onTitleLayout = (event: LayoutChangeEvent) => {
    setTitleWidth(event.nativeEvent.layout.width);
  };

  const brandAnimatedStyle = useAnimatedStyle(() => ({
    marginBottom: interpolate(brandProgress.value, [0, 1], [32, 14]),
  }));

  const brandRowAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(brandProgress.value, [0, 1], [STACK_HEIGHT, ROW_HEIGHT]),
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const restX = (BRAND_ROW_GAP + titleWidth) / 2;
    return {
      transform: [
        { translateX: interpolate(brandProgress.value, [0, 1], [restX, 0]) },
        { translateY: interpolate(brandProgress.value, [0, 1], [LOGO_REST_Y, 0]) },
      ],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const restX = -(LOGO_SIZE + BRAND_ROW_GAP) / 2;
    return {
      transform: [
        { translateX: interpolate(brandProgress.value, [0, 1], [restX, 0]) },
        { translateY: interpolate(brandProgress.value, [0, 1], [TITLE_REST_Y, 0]) },
      ],
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(brandProgress.value, [0, 1], [1, 0]),
    transform: [
      { translateY: interpolate(brandProgress.value, [0, 1], [0, -8]) },
    ],
  }));

  // Restore the last family so the field starts collapsed for returning users.
  useEffect(() => {
    AsyncStorage.getItem(LAST_FAMILY_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as FamilyModel;
        if (parsed && parsed.id && parsed.code) {
          setFamily(parsed);
          setFamilyCode(parsed.code);
          setShowFamilyField(false);
        }
      })
      .catch((error) => console.log("RestoreFamilyError", error));
  }, []);

  /**
   * Looks up the family for the typed code; returns it (or null) and records it.
   *
   * `force` skips the cache. The blur/typing callbacks reuse a resolved family
   * for a snappy checkmark, but login must not: a family can be deleted and
   * re-created with the same code and a *new* id, and a device still holding the
   * old family would otherwise keep building its synthetic email against the
   * dead id — an "invalid password" that no password can fix.
   */
  const resolveFamily = async (
    { force = false }: { force?: boolean } = {}
  ): Promise<FamilyModel | null> => {
    const code = familyCode.trim();
    if (!code) {
      setFamily(null);
      setNotFound(false);
      return null;
    }
    // Already resolved to this exact code — don't re-fetch, unless the caller
    // needs the authoritative id.
    if (
      !force &&
      family &&
      family.code === code.toLowerCase().replace(/\s+/g, "_")
    ) {
      return family;
    }
    setIsResolving(true);
    try {
      const found = await getFamilyByCode(code);
      setFamily(found);
      setNotFound(!found);
      return found;
    } catch (error) {
      console.log("ResolveFamilyError", error);
      setFamily(null);
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Authoritative lookup: never sign in against a cached family id.
      const resolved = await resolveFamily({ force: true });
      if (!resolved) {
        showToast(
          "error",
          "Family not found",
          "Check the Family ID and try again.",
          "top"
        );
        return;
      }
      const session = await signInWithCredentials(
        resolved.id,
        username.trim(),
        password
      );
      if (session) {
        // Remember this family so next time the field starts collapsed.
        rememberFamily(resolved);
        // Persisting the session keeps the user logged in across restarts; the
        // navigator swaps to the app stack as soon as this resolves.
        await signIn(session);
      } else {
        showToast(
          "error",
          "Login Error",
          "Either username or password is incorrect",
          "top"
        );
      }
    } catch (error) {
      console.log("LoginError", error);
      // Show what actually failed. "Something went wrong" hid real, actionable
      // reasons — a blocked profile read, a network error — behind a message
      // that made every one of them look the same.
      showToast(
        "error",
        "Login Error",
        error instanceof Error ? error.message : "Something went wrong.",
        "top"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Android needs bottom padding too. Since edge-to-edge became mandatory
    // the window no longer resizes for the keyboard, so the manifest's
    // adjustResize does nothing and an undefined behavior left the password
    // field sitting behind the IME. useAnimatedKeyboard (above) drives this
    // padding on the UI thread, in sync with the native keyboard frame.
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={false}
      >
        <Animated.View style={[styles.brand, brandAnimatedStyle]}>
          <Animated.View style={[styles.brandRow, brandRowAnimatedStyle]}>
            <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
              <Image
                source={require("../../assets/favicon.png")}
                style={styles.logo}
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
            <Animated.View style={titleAnimatedStyle} onLayout={onTitleLayout}>
              <Text style={styles.title}>AssetDiary</Text>
            </Animated.View>
          </Animated.View>
          <Animated.View style={subtitleAnimatedStyle}>
            {family ? (
              <Text style={styles.welcome} numberOfLines={2}>
                Welcome to {family.name}
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                Enter your Family ID to sign in.
              </Text>
            )}
          </Animated.View>
        </Animated.View>

        <View style={styles.card}>
          {showFamilyField ? (
            <>
              <Text style={styles.label}>Family ID</Text>
              <View
                style={[
                  styles.inputRow,
                  focusedField === "family" && styles.inputRowFocused,
                  notFound && styles.inputRowError,
                ]}
              >
                <Ionicons
                  name="home-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. smith_family"
                  placeholderTextColor={colors.placeholder}
                  value={familyCode}
                  onChangeText={(value) => {
                    setFamilyCode(value);
                    // Any edit invalidates a previous lookup.
                    if (family || notFound) {
                      setFamily(null);
                      setNotFound(false);
                    }
                  }}
                  onFocus={() => setFocusedField("family")}
                  onBlur={() => {
                    setFocusedField(null);
                    resolveFamily();
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    resolveFamily();
                    usernameRef.current?.focus();
                  }}
                />
                {isResolving && (
                  <Ionicons
                    name="sync-outline"
                    size={16}
                    color={colors.textMuted}
                  />
                )}
                {!isResolving && family && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.positive}
                  />
                )}
              </View>
              {notFound && (
                <Text style={styles.errorHint}>
                  No family found with that ID.
                </Text>
              )}
            </>
          ) : (
            <View style={styles.familyChip}>
              <Ionicons
                name="home"
                size={18}
                color={colors.primary}
                style={styles.inputIcon}
              />
              <Text style={styles.familyChipName} numberOfLines={1}>
                {family?.name ?? familyCode}
              </Text>
              <Pressable
                onPress={() => setShowFamilyField(true)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/recover-family")}
            accessibilityRole="button"
            hitSlop={6}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot your Family ID?</Text>
          </Pressable>

          <Text style={[styles.label, styles.labelSpacing]}>Username</Text>
          <View
            style={[
              styles.inputRow,
              focusedField === "username" && styles.inputRowFocused,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={usernameRef}
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.placeholder}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Password</Text>
          <View
            style={[
              styles.inputRow,
              focusedField === "password" && styles.inputRowFocused,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Pressable
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? "Hide password" : "Show password"
              }
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <Button
            onPress={handleLogin}
            title="Login"
            loading={isLoading}
            buttonStyle={styles.loginButton}
          />
        </View>

        <Pressable
          onPress={() => router.push("/register")}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            New family? <Text style={styles.registerCta}>Register here</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    brand: {
      alignItems: "center",
      // marginBottom is animated (see brandAnimatedStyle) to compact as the
      // keyboard opens; base value lives there, not here.
    },
    // Row that holds the logo + title. Its height is animated between the
    // stacked (rest) and side-by-side (keyboard open) footprint; the logo
    // and title are then pulled apart into the stacked look with
    // translateX/Y at rest (see logoAnimatedStyle/titleAnimatedStyle).
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    logoWrap: {
      marginRight: BRAND_ROW_GAP,
    },
    // The mark carries its own lapis field, so no tinted backing behind it.
    logo: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      borderRadius: 22,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: TITLE_LINE_HEIGHT,
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: "center",
      lineHeight: 20,
    },
    welcome: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
      marginTop: 8,
      textAlign: "center",
      textTransform: "capitalize",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 20,
      ...elevation.ambient,
      shadowColor: colors.shadow,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    labelSpacing: {
      marginTop: 18,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.control,
      paddingHorizontal: 12,
    },
    inputRowFocused: {
      borderColor: colors.primary,
    },
    inputRowError: {
      borderColor: colors.negative,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    errorHint: {
      fontSize: 12,
      color: colors.negative,
      marginTop: 6,
    },
    familyChip: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.control,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    familyChipName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      textTransform: "capitalize",
    },
    changeText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    forgotLink: {
      alignSelf: "flex-start",
      marginTop: 10,
    },
    forgotText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    loginButton: {
      width: "100%",
      marginTop: 26,
    },
    registerLink: {
      alignItems: "center",
      marginTop: 22,
    },
    registerText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    registerCta: {
      color: colors.primary,
      fontWeight: "700",
    },
  });

export default LoginScreen;
