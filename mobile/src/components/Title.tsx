import { StyleSheet, Text } from "react-native";

type TitleProps = {
  text: string;
};

export function Title({ text }: TitleProps) {
  return <Text style={styles.title}>{text}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
  },
});
