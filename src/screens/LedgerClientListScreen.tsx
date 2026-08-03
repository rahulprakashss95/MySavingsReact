import React, { useMemo } from "react";
import GroupedList from "../components/GroupedList";
import { useCollectionState } from "../query/hooks";
import GroupedRow from "../components/GroupedRow";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LedgerClientModel } from "../models/LedgerModel";
import { formatPhone } from "../utils/countryCodes";
import { byText } from "../utils/grouping";
import { useRouter } from "expo-router";

/** Phone and email on one line, whichever of them exists. */
const contactLine = (client: LedgerClientModel) =>
  [formatPhone(client.dialCode, client.phone), client.email]
    .filter(Boolean)
    .join(" · ");

type Props = {
  /**
   * Where this list's rows and its + button navigate. There is one contacts
   * directory but two ways in — Ledger for the people who pay you, Accounts for
   * the banks and borrowers — and each stays inside its own tab's stack so a
   * member holding only one of the two tiles can still reach it.
   */
  basePath?: string;
};

const LedgerClientListScreen = ({
  basePath = "/ledger/clients",
}: Props = {}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { items, ...list } =
    useCollectionState<LedgerClientModel>("ledgerClients");

  // Private to one login and usually short, so a flat alphabetical list reads
  // cleaner than letter headings — one section, headers hidden. Stay empty when
  // there are no clients so GroupedList's empty state shows (a SectionList only
  // renders ListEmptyComponent when there are zero sections).
  const sections = useMemo(
    () =>
      items.length
        ? [
            {
              key: "all",
              title: "",
              data: [...items].sort((a, b) => byText(a.name, b.name)),
            },
          ]
        : [],
    [items]
  );

  const navigateAddEdit = (data: LedgerClientModel | null) => {
    router.push(`${basePath}/${data ? data.id : "new"}`);
  };

  return (
    <GroupedList
      {...list}
      sections={sections}
      hideSectionHeaders
      keyOf={(item) => item.id}
      noun="contact"
      addLabel="Add Contact"
      onAdd={() => navigateAddEdit(null)}
      emptyIcon="people-outline"
      emptyTitle="No contacts yet"
      emptyBody="Tap the + button to add a person, bank or firm."
      renderItem={(item, position) => (
        <GroupedRow
          icon="person-outline"
          accent={colors.accentViolet}
          value={item.name}
          // In subtitle, not title: title renders uppercase and would mangle
          // an email address.
          subtitle={contactLine(item) || undefined}
          description={item.description}
          onPress={() => navigateAddEdit(item)}
          position={position}
        />
      )}
    />
  );
};

export default LedgerClientListScreen;
