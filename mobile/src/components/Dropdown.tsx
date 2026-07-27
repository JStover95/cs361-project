import { Host, Picker } from "@expo/ui";
import { StyleSheet, Text, View } from "react-native";

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
};

export function Dropdown({
  label,
  value,
  options,
  onValueChange,
}: DropdownProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Host matchContents style={styles.host}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            testID={label}
          >
            <Picker.Item label="Select..." value="" />
            {options.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </Host>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#D9D9D9",
    borderRadius: 24,
    overflow: "hidden",
  },
  host: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
