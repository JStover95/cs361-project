import { ReactNode } from "react";
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "./Button";

type ModalButton = {
  label: string;
  onPress: () => void;
};

type ModalProps = {
  header: string;
  children: ReactNode;
  leftButton?: ModalButton;
  rightButton: ModalButton;
};

export function Modal({
  header,
  children,
  leftButton,
  rightButton,
}: ModalProps) {
  return (
    <RNModal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{header}</Text>
          </View>
          <View style={styles.body}>
            {typeof children === "string" ? (
              <Text style={styles.bodyText}>{children}</Text>
            ) : (
              children
            )}
            <View style={styles.buttons}>
              {leftButton && (
                <Button
                  label={leftButton.label}
                  onPress={leftButton.onPress}
                />
              )}
              <Button
                label={rightButton.label}
                onPress={rightButton.onPress}
              />
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    backgroundColor: "#D9D9D9",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  body: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  bodyText: {
    fontSize: 16,
    color: "#000",
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
});
