import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Text from "../components/Text";
import { saveMetalRates } from "../../database/query";
import {
  commitMetalRates,
  useAppDispatch,
  useCollectionState,
  useMetalRates,
  useOwnerName,
} from "../query/hooks";
import MetalRatesModal from "../components/MetalRatesModal";
import ProgressBar from "../components/ProgressBar";
import { OverviewSkeleton } from "../components/Skeleton";
import { useTheme } from "../context/ThemeContext";
import { useCountUp } from "../hooks/useCountUp";
import {
  EMPTY_METAL_RATES,
  MetalRates,
  OrnamentModel,
  PropertyModel,
} from "../models/AssetModel";
import {
  formatNumber,
  gramsToPawn,
  MetalTotal,
  ornamentsByHolder,
  ornamentTotals,
  propertyPortfolio,
} from "../utils/assets";
import { ThemeColors } from "../utils/Color";
import { gradientAngle, motion, radius } from "../utils/tokens";
import { amountFormat, showToast } from "../utils/Utils";
import { useAuth } from "../context/AuthContext";
import { hasFeature, includedInPortfolio } from "../models/common";
import { AccountModel } from "../models/AccountModel";
import { buildAccountTotals } from "../utils/deposits";

/** Staggered mount-in for the screen's top-level card blocks. */
const sectionDelay = (index: number) =>
  Math.min(index * motion.staggerDelay * 2, motion.staggerMaxDelay);

/**
 * `amountFormat` returns "" for anything falsy, so a zero would render as a
 * lone "₹" — and an overview is exactly where zeroes show up, in every section
 * that hasn't been filled in yet.
 */
const rupees = (value: number) => {
  const rounded = Math.round(value);
  return `₹ ${rounded ? amountFormat(rounded) : "0"}`;
};

const percent = (share: number) => `${Math.round(share * 100)}%`;

/** "1 property" / "3 properties" — every section caption counts something. */
const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

type Styles = ReturnType<typeof createStyles>;
type Chrome = { colors: ThemeColors; styles: Styles };

/** The three things net worth is made of, keyed to one colour apiece. */
type SegmentKey = "ornaments" | "property" | "accounts";

type Segment = {
  key: SegmentKey;
  label: string;
  value: number;
  color: string;
  href: string;
};

/**
 * Every section carries the same header: what it is, what it totals, and a way
 * into the list behind it. The total sits in the header rather than repeated as
 * a first row, so the eye can run down one column of figures.
 */
const SectionHeader = ({
  title,
  value,
  caption,
  onPress,
  colors,
  styles,
}: Chrome & {
  title: string;
  value?: string;
  caption?: string;
  onPress?: () => void;
}) => {
  const body = (
    <>
      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionHeadRight}>
          {!!value && <Text style={styles.sectionValue}>{value}</Text>}
          {!!onPress && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          )}
        </View>
      </View>
      {!!caption && <Text style={styles.sectionCaption}>{caption}</Text>}
    </>
  );

  if (!onPress) {
    return <View style={styles.sectionHead}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}
      style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
};

/**
 * A labelled figure with its bar. Label and value are always spelled out, so
 * the bar only ever restates a comparison the reader can already make.
 */
const MeterRow = ({
  label,
  value,
  meta,
  trailing,
  share,
  color,
  styles,
}: Pick<Chrome, "styles"> & {
  label: string;
  value: string;
  meta?: string;
  /** Right-hand end of the meta line — usually the share of the section. */
  trailing?: string;
  /** 0–1. Omit to drop the bar, for rows that have nothing to compare. */
  share?: number;
  color: string;
}) => (
  <View style={styles.meterRow}>
    <View style={styles.rowBetween}>
      <Text style={styles.meterLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.meterValue}>{value}</Text>
    </View>
    {(!!meta || !!trailing) && (
      <View style={styles.rowBetween}>
        <Text style={styles.meterMeta} numberOfLines={1}>
          {meta ?? ""}
        </Text>
        {!!trailing && <Text style={styles.meterMeta}>{trailing}</Text>}
      </View>
    )}
    {share !== undefined && (
      <View style={styles.barWrap}>
        <ProgressBar progress={share} color={color} />
      </View>
    )}
  </View>
);

const AssetOverviewScreen = () => {
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);

  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Same anchored push the Home dashboard uses, so arriving from either place
  // leaves the same back stack behind.
  const open = (href: string) => router.push(href as never, { withAnchor: true });

  // Ornaments, properties and accounts come from the shared cache; metal rates
  // from their own cached doc — none of them re-read on focus.
  const ornamentState = useCollectionState<OrnamentModel>("ornaments");
  const propertyState = useCollectionState<PropertyModel>("properties");
  const accountState = useCollectionState<AccountModel>("accounts");
  const ratesState = useMetalRates();

  const ornaments = ornamentState.items;
  const properties = propertyState.items;
  const rates = ratesState.value ?? EMPTY_METAL_RATES;

  // A record switched off `includeInPortfolio` still exists — it's just left
  // out of every total this screen shows. Kept separate from the raw arrays
  // above, which the empty-state check still needs unfiltered.
  const worthOrnaments = useMemo(
    () => ornaments.filter((o) => includedInPortfolio(o)),
    [ornaments]
  );
  const worthProperties = useMemo(
    () => properties.filter((p) => includedInPortfolio(p)),
    [properties]
  );
  const worthAccounts = useMemo(
    () => accountState.items.filter((a) => includedInPortfolio(a)),
    [accountState.items]
  );

  // Deposits/balances count toward net worth only for members who hold the
  // Accounts tile — the overview reflects the tiles you can see.
  const showAccounts = hasFeature(user, "accounts");
  const accountTotals = useMemo(
    () => buildAccountTotals(worthAccounts),
    [worthAccounts]
  );

  const hasLoaded =
    ornamentState.hasLoaded &&
    propertyState.hasLoaded &&
    accountState.hasLoaded &&
    ratesState.loaded;
  const isRefreshing =
    ornamentState.isRefreshing ||
    propertyState.isRefreshing ||
    accountState.isRefreshing ||
    ratesState.isRefreshing;
  const onRefresh = () => {
    ornamentState.onRefresh();
    propertyState.onRefresh();
    accountState.onRefresh();
    ratesState.onRefresh();
  };

  const ornamentSummary = useMemo(
    () => ornamentTotals(worthOrnaments, rates),
    [worthOrnaments, rates]
  );
  const nameOf = useOwnerName();
  const holders = useMemo(
    () => ornamentsByHolder(worthOrnaments, rates, nameOf),
    [worthOrnaments, rates, nameOf]
  );
  const portfolio = useMemo(
    () => propertyPortfolio(worthProperties),
    [worthProperties]
  );

  // The composition bar stacks what is *held*, so every segment is a positive
  // magnitude; borrowing is netted off the headline underneath rather than drawn
  // as a slice, which a stacked bar has no honest way to show.
  const accountAssets = showAccounts ? accountTotals.assets : 0;
  const liabilities = showAccounts ? accountTotals.liabilities : 0;
  const grossValue =
    ornamentSummary.totalValue + portfolio.total + accountAssets;
  const netValue = grossValue - liabilities;
  const showOwed = liabilities > 0;
  const hasRates = !!rates.goldPerGram || !!rates.silverPerGram;

  // Colours match the Home dashboard's worth card exactly — the same money is
  // the same colour wherever it is drawn.
  const segments = useMemo<Segment[]>(() => {
    const list: Segment[] = [
      {
        key: "ornaments",
        label: "Ornaments",
        value: ornamentSummary.totalValue,
        color: colors.accentAmber,
        href: "/assets/ornaments",
      },
      {
        key: "property",
        label: "Property",
        value: portfolio.total,
        color: colors.accentViolet,
        href: "/assets/properties",
      },
    ];
    if (showAccounts) {
      list.push({
        key: "accounts",
        label: "Cash & Deposits",
        value: accountAssets,
        color: colors.accentBlue,
        href: "/assets/accounts",
      });
    }
    return list;
  }, [
    ornamentSummary.totalValue,
    portfolio.total,
    accountAssets,
    showAccounts,
    colors,
  ]);

  const priced = segments.filter((segment) => segment.value > 0);

  // Everything that qualifies the headline, gathered in one place instead of
  // stacked as loose amber sentences under the number.
  const notes = useMemo(() => {
    const list: string[] = [];
    if (worthOrnaments.length > 0 && !hasRates) {
      list.push(
        "No metal rates are set, so ornaments count as nothing here. Set them in the Ornaments section below."
      );
    }
    if (ornamentSummary.hasUnvalued) {
      list.push("Diamond and platinum aren't priced, so this total is a floor.");
    }
    if (ornamentSummary.hasAssumedKarat) {
      list.push(
        "Some gold has no purity set and is valued as 22K. Edit those pieces to correct the total."
      );
    }
    if (portfolio.remaining > 0) {
      list.push(
        `Property is counted at full cost — ${rupees(
          portfolio.remaining
        )} of it is still unpaid.`
      );
    }
    return list;
  }, [
    worthOrnaments.length,
    hasRates,
    ornamentSummary.hasUnvalued,
    ornamentSummary.hasAssumedKarat,
    portfolio.remaining,
  ]);

  const handleSaveRates = (next: MetalRates) => {
    setIsSavingRates(true);
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    saveMetalRates(stamped)
      .then(() => {
        dispatch(commitMetalRates(stamped));
        setIsRatesModalOpen(false);
        showToast("success", "Rates saved", "Saved for everyone.", "bottom");
      })
      .catch((error) => {
        showToast("error", "Unable to save rates", String(error), "bottom");
      })
      .finally(() => setIsSavingRates(false));
  };

  const renderMetalRow = (row: MetalTotal) => {
    const share =
      ornamentSummary.totalValue > 0
        ? row.value / ornamentSummary.totalValue
        : 0;
    // Summed floats: 8.1 + 16.2 lands on 24.299999999999997 without this.
    const grams = formatNumber(row.grams);
    const pawn = gramsToPawn(grams);
    const pieces = row.pieces === 1 ? "1 piece" : `${row.pieces} pieces`;

    return (
      <View key={row.metal}>
        <MeterRow
          styles={styles}
          label={row.metal}
          value={row.valued ? rupees(row.value) : "Not valued"}
          meta={`${grams} g${pawn ? ` · ${pawn} pawn` : ""} · ${pieces}`}
          trailing={row.valued ? percent(share) : undefined}
          share={row.valued ? share : undefined}
          color={colors.accentAmber}
        />

        {/* Gold splits by purity: 22K is worth 8% less per gram than 24K. */}
        {row.karats.length > 1 && (
          <View style={styles.subRows}>
            {row.karats.map((karat) => (
              <View key={karat.karat} style={styles.subRow}>
                <Text style={styles.subRowName}>{karat.karat}</Text>
                <Text style={styles.subRowMeta}>
                  {formatNumber(karat.grams)} g
                </Text>
                <Text style={styles.subRowValue}>{rupees(karat.value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!hasLoaded) {
    return (
      <View style={styles.container}>
        <OverviewSkeleton />
      </View>
    );
  }

  const isEmpty =
    ornaments.length === 0 &&
    properties.length === 0 &&
    accountState.items.length === 0;

  const largestHolder = holders.length ? holders[0].value : 0;
  const largestSection = accountTotals.balanceBySection.reduce(
    (max, row) => Math.max(max, row.value),
    0
  );
  // Gated like every other account figure: a member without the Accounts tile
  // must not learn what the family's deposits earn from a stat tile.
  const interest = showAccounts ? accountTotals.interestPerYear : 0;

  // Once anything is borrowed, the count of accounts is the less useful fact:
  // what the section header owes the reader is how its net figure was reached.
  let accountsCaption: string | undefined;
  if (accountTotals.accountCount > 0) {
    accountsCaption = showOwed
      ? `${rupees(accountTotals.assets)} held, less ${rupees(liabilities)} owed`
      : plural(accountTotals.accountCount, "account", "accounts");
  }

  const ratesUpdated = rates.updatedAt
    ? moment(rates.updatedAt).fromNow()
    : "never";

  return (
    <View style={styles.container}>
      <MetalRatesModal
        visible={isRatesModalOpen}
        rates={rates}
        isSaving={isSavingRates}
        onClose={() => setIsRatesModalOpen(false)}
        onSave={handleSaveRates}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        }
      >
        {/* ---- Headline ------------------------------------------------- */}
        <HeroCard
          netValue={netValue}
          showOwed={showOwed}
          grossValue={grossValue}
          liabilities={liabilities}
          priced={priced}
          segments={segments}
          notes={notes}
          onOpen={open}
          colors={colors}
          styles={styles}
        />

        {/* ---- The figures worth knowing without opening a section ------- */}
        {(interest > 0 || portfolio.remaining > 0 || showOwed) && (
          <Animated.View
            entering={FadeInDown.delay(sectionDelay(1)).duration(motion.staggerDuration)}
            style={styles.statGrid}
          >
            {interest > 0 && (
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Deposit interest</Text>
                <Text style={[styles.statValue, styles.positive]}>
                  {rupees(interest)}
                </Text>
                <Text style={styles.statCaption}>
                  a year · {rupees(interest / 12)} a month
                </Text>
              </View>
            )}
            {portfolio.remaining > 0 && (
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>Property still owed</Text>
                <Text style={[styles.statValue, styles.owed]}>
                  {rupees(portfolio.remaining)}
                </Text>
                <Text style={styles.statCaption}>
                  {percent(portfolio.progress)} of cost paid
                </Text>
              </View>
            )}
            {showOwed && (
              <View style={styles.statTile}>
                <Text style={styles.statLabel}>You owe</Text>
                <Text style={[styles.statValue, styles.liability]}>
                  {rupees(liabilities)}
                </Text>
                <Text style={styles.statCaption}>
                  already subtracted above
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {isEmpty && (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              Nothing recorded yet. Add an ornament, a property or an account and
              this page fills in.
            </Text>
          </View>
        )}

        {/* ---- Ornaments ------------------------------------------------- */}
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(2)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <SectionHeader
            colors={colors}
            styles={styles}
            title="Ornaments"
            value={rupees(ornamentSummary.totalValue)}
            caption={
              ornamentSummary.rows.length > 0
                ? `${formatNumber(ornamentSummary.totalGrams)} g in total`
                : undefined
            }
            onPress={() => open("/assets/ornaments")}
          />

          {/* Rates belong to this section — they are the only thing that turns
              grams into rupees — so the way to edit them lives here. */}
          <Pressable
            onPress={() => setIsRatesModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit metal rates"
            style={({ pressed }) => [
              styles.ratesStrip,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={hasRates ? colors.textMuted : colors.primary}
            />
            <View style={styles.ratesText}>
              <Text style={hasRates ? styles.ratesValue : styles.ratesPrompt}>
                {hasRates
                  ? `Gold ₹${rates.goldPerGram}/g · Silver ₹${rates.silverPerGram}/g`
                  : "Set metal rates"}
              </Text>
              <Text style={styles.ratesMeta}>
                {hasRates
                  ? `Updated ${ratesUpdated}`
                  : "Ornaments can't be valued without them."}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </Pressable>

          {ornamentSummary.rows.length === 0 ? (
            <Text style={styles.emptyText}>No ornaments recorded yet.</Text>
          ) : (
            ornamentSummary.rows.map(renderMetalRow)
          )}
        </Animated.View>

        {/* ---- By holder -------------------------------------------------- */}
        {holders.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(sectionDelay(3)).duration(motion.staggerDuration)}
            style={styles.card}
          >
            <SectionHeader
              colors={colors}
              styles={styles}
              title="Ornaments by holder"
              caption={plural(holders.length, "holder", "holders")}
            />
            {holders.map((holder) => (
              <MeterRow
                key={holder.name}
                styles={styles}
                label={holder.name}
                value={rupees(holder.value)}
                meta={`${formatNumber(holder.grams)} g`}
                share={largestHolder > 0 ? holder.value / largestHolder : 0}
                color={colors.accentAmber}
              />
            ))}
          </Animated.View>
        )}

        {/* ---- Property --------------------------------------------------- */}
        <Animated.View
          entering={FadeInDown.delay(sectionDelay(4)).duration(motion.staggerDuration)}
          style={styles.card}
        >
          <SectionHeader
            colors={colors}
            styles={styles}
            title="Property"
            value={rupees(portfolio.total)}
            caption={
              portfolio.count > 0
                ? `${plural(portfolio.count, "property", "properties")} at cost`
                : undefined
            }
            onPress={() => open("/assets/properties")}
          />

          {portfolio.count === 0 ? (
            <Text style={styles.emptyText}>No properties recorded yet.</Text>
          ) : (
            <>
              <View style={styles.splitRow}>
                <View style={styles.split}>
                  <Text style={styles.statLabel}>Paid</Text>
                  <Text style={[styles.splitValue, styles.positive]}>
                    {rupees(portfolio.paid)}
                  </Text>
                </View>
                <View style={styles.split}>
                  <Text style={styles.statLabel}>Still owed</Text>
                  <Text style={[styles.splitValue, styles.owed]}>
                    {rupees(portfolio.remaining)}
                  </Text>
                </View>
              </View>

              <View style={styles.barWrap}>
                <ProgressBar
                  progress={portfolio.progress}
                  color={colors.accentViolet}
                />
              </View>

              <Text style={styles.footnote}>
                {percent(portfolio.progress)} paid
                {portfolio.outstandingCount > 0
                  ? ` · ${portfolio.outstandingCount} still owing`
                  : " · all settled"}
              </Text>
            </>
          )}
        </Animated.View>

        {/* ---- Cash, deposits and dues ------------------------------------ */}
        {showAccounts && (
          <Animated.View
            entering={FadeInDown.delay(sectionDelay(5)).duration(motion.staggerDuration)}
            style={styles.card}
          >
            <SectionHeader
              colors={colors}
              styles={styles}
              title="Cash, Deposits & Dues"
              value={rupees(accountTotals.balance)}
              caption={accountsCaption}
              onPress={() => open("/assets/accounts")}
            />

            {accountTotals.accountCount === 0 ? (
              <Text style={styles.emptyText}>No accounts recorded yet.</Text>
            ) : (
              <>
                {/* Section values are all positive magnitudes — "Loans" is what
                    you owe, so only its colour says which way it points. */}
                {accountTotals.balanceBySection.map((row) => {
                  const owes = row.label === "Loans";
                  return (
                    <MeterRow
                      key={row.label}
                      styles={styles}
                      label={owes ? "Loans (you owe)" : row.label}
                      value={rupees(row.value)}
                      share={
                        largestSection > 0 ? row.value / largestSection : 0
                      }
                      color={owes ? colors.negative : colors.accentBlue}
                    />
                  );
                })}

                {accountTotals.depositValue > 0 && (
                  <View style={styles.inset}>
                    <Text style={styles.insetTitle}>Deposits</Text>
                    <View style={styles.insetRow}>
                      <Text style={styles.insetLabel}>Held in deposits</Text>
                      <Text style={styles.insetValue}>
                        {rupees(accountTotals.depositValue)}
                      </Text>
                    </View>

                    {/* Per-payout amounts are never summed: a quarterly ₹3,000
                        and a monthly ₹3,000 are four times apart, so every
                        deposit is annualised before it lands here. Both readings
                        of the same annual figure are given, because "a month" is
                        how most people hold the number in their head. */}
                    {interest > 0 && (
                      <>
                        <View style={styles.insetRow}>
                          <Text style={styles.insetLabel}>Interest a year</Text>
                          <Text style={[styles.insetValue, styles.positive]}>
                            {rupees(interest)}
                          </Text>
                        </View>
                        <View style={styles.insetRow}>
                          <Text style={styles.insetLabel}>
                            Which is, a month
                          </Text>
                          <Text style={styles.insetValue}>
                            {rupees(accountTotals.interestPerMonth)}
                          </Text>
                        </View>
                        {accountTotals.effectiveYield > 0 && (
                          <View style={styles.insetRow}>
                            <Text style={styles.insetLabel}>
                              Effective yield
                            </Text>
                            <Text style={styles.insetValue}>
                              {(accountTotals.effectiveYield * 100).toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {accountTotals.interestEstimated && (
                      <Text style={styles.footnote}>
                        Some deposits have no payout amount recorded, so their
                        interest is worked out from the rate.
                      </Text>
                    )}
                    {accountTotals.depositsWithoutInterest > 0 && (
                      <Text style={styles.footnote}>
                        {accountTotals.depositsWithoutInterest} of these carry no
                        interest details — recurring deposits keep no rate — so
                        they add nothing to the figures above.
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * The one hero moment on this screen: a gradient banner for the headline
 * figure over a flat zone that keeps the accent-coloured composition bar and
 * chips legible (see HomeScreen's `WorthCard` for the same split-card
 * pattern and the reasoning behind it).
 */
const HeroCard = ({
  netValue,
  showOwed,
  grossValue,
  liabilities,
  priced,
  segments,
  notes,
  onOpen,
  colors,
  styles,
}: Chrome & {
  netValue: number;
  showOwed: boolean;
  grossValue: number;
  liabilities: number;
  priced: Segment[];
  segments: Segment[];
  notes: string[];
  onOpen: (href: string) => void;
}) => {
  const animatedNet = useCountUp(netValue);

  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={gradientAngle.start}
        end={gradientAngle.end}
        style={styles.heroTop}
      >
        <Text style={styles.heroLabel}>
          {showOwed ? "Net asset value" : "Total asset value"}
        </Text>
        <Text style={styles.heroValue}>{rupees(animatedNet)}</Text>

        {showOwed && (
          <Text style={styles.heroDeduction}>
            {rupees(grossValue)} held, less {rupees(liabilities)} borrowed
          </Text>
        )}
      </LinearGradient>

      <View style={styles.heroBottom}>
        {priced.length > 0 && (
          <View
            style={styles.compositionBar}
            accessibilityLabel="Composition of total asset value"
          >
            {priced.map((segment) => (
              <View
                key={segment.key}
                style={{
                  flex: segment.value / grossValue,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.chipWrap}>
          {segments.map((segment) => (
            <Pressable
              key={segment.key}
              onPress={() => onOpen(segment.href)}
              accessibilityRole="button"
              accessibilityLabel={`${segment.label}, ${rupees(segment.value)}`}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <View style={[styles.chipDot, { backgroundColor: segment.color }]} />
              <Text style={styles.chipLabel}>{segment.label}</Text>
              <Text style={styles.chipValue}>{rupees(segment.value)}</Text>
            </Pressable>
          ))}
        </View>

        {notes.length > 0 && (
          <View style={styles.notes}>
            {notes.map((note) => (
              <View key={note} style={styles.noteRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={colors.accentAmber}
                  style={styles.noteIcon}
                />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },

    // Headline — gradient top zone + flat bottom zone, see `HeroCard`.
    heroCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: colors.card,
      marginBottom: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 4,
    },
    heroTop: {
      padding: 20,
      paddingBottom: 22,
    },
    heroBottom: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.onPrimary,
      opacity: 0.75,
    },
    heroValue: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.onPrimary,
      marginTop: 8,
      fontVariant: ["tabular-nums"],
    },
    heroDeduction: {
      fontSize: 13,
      color: colors.onPrimary,
      opacity: 0.75,
      marginTop: 6,
      fontVariant: ["tabular-nums"],
    },
    compositionBar: {
      flexDirection: "row",
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 16,
      backgroundColor: colors.chartTrack,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 14,
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.inputBackground,
    },
    chipDot: { width: 8, height: 8, borderRadius: 4 },
    chipLabel: { fontSize: 13, color: colors.textMuted },
    chipValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    notes: {
      marginTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 12,
      gap: 8,
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    noteIcon: {
      marginRight: 8,
      marginTop: 1,
    },
    noteText: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },

    // KPI tiles. Two to a row; a third stretches across the next one rather
    // than sitting half-width beside a gap.
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    statTile: {
      flexGrow: 1,
      flexBasis: "46%",
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 14,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    statCaption: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },

    // Sections
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 14,
    },
    sectionHead: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: 12,
      marginBottom: 16,
    },
    sectionHeadRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionHeadRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginRight: 12,
    },
    sectionValue: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    sectionCaption: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },

    // Metal rates, inside the ornaments section it governs.
    ratesStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 18,
    },
    ratesText: { flex: 1 },
    ratesValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    ratesPrompt: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    ratesMeta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },

    // Meter rows
    meterRow: {
      marginBottom: 16,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    meterLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginRight: 12,
      textTransform: "capitalize",
    },
    meterValue: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    meterMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    barWrap: {
      marginTop: 8,
    },

    // Karat breakdown, indented under its metal.
    subRows: {
      marginTop: -8,
      marginBottom: 16,
      paddingLeft: 12,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
      gap: 6,
    },
    subRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    subRowName: {
      width: 44,
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
    },
    subRowMeta: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },
    subRowValue: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },

    // Paid / owed pairs
    splitRow: {
      flexDirection: "row",
    },
    split: {
      flex: 1,
    },
    splitValue: {
      fontSize: 20,
      fontWeight: "700",
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },

    // Deposit interest, inset inside the accounts section.
    inset: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 14,
      marginTop: 2,
    },
    insetTitle: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginBottom: 10,
    },
    insetRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    insetLabel: {
      fontSize: 13,
      color: colors.textMuted,
    },
    insetValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },

    footnote: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 8,
      lineHeight: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    pressed: {
      opacity: 0.6,
    },

    // Money owed, wherever it appears — never the same colour as money held.
    liability: { color: colors.negative },
    owed: { color: colors.accentAmber },
    positive: { color: colors.positive },
  });

export default AssetOverviewScreen;
