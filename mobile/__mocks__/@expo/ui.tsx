import React from "react";
import { Pressable, Text, View, ViewProps } from "react-native";

type PickerItemProps = {
  label: string;
  value: string;
};

type PickerProps = {
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  testID?: string;
  appearance?: "menu" | "wheel";
  enabled?: boolean;
};

function Host({ children, style, ...props }: ViewProps) {
  return (
    <View testID="expo-ui-host" style={style} {...props}>
      {children}
    </View>
  );
}

function PickerItem(_props: PickerItemProps) {
  return null;
}

function Picker({
  selectedValue,
  onValueChange,
  children,
  testID,
}: PickerProps) {
  const items = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<PickerItemProps> =>
      React.isValidElement(child)
  );
  const group = testID ?? "Picker";

  return (
    <View testID={`picker-${group}`} accessibilityLabel={group}>
      <Text testID={`picker-selected-${group}`}>{selectedValue ?? ""}</Text>
      {items.map((item) => (
        <Pressable
          key={`${group}-${String(item.props.value)}`}
          accessibilityRole="button"
          accessibilityLabel={`Select ${group} ${item.props.label}`}
          onPress={() => onValueChange?.(item.props.value)}
        >
          <Text>{item.props.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

Picker.Item = PickerItem;

export { Host, Picker };
