import React, { forwardRef } from "react";
import { View, ViewProps } from "react-native";

type BottomSheetProps = ViewProps & {
  children?: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  onChange?: (index: number) => void;
  onClose?: () => void;
  backgroundStyle?: object;
  handleIndicatorStyle?: object;
};

const BottomSheet = forwardRef<View, BottomSheetProps>(
  ({ children, ...props }, ref) => (
    <View ref={ref} testID="bottom-sheet" {...props}>
      {children}
    </View>
  )
);
BottomSheet.displayName = "BottomSheet";

function BottomSheetView({ children, ...props }: ViewProps) {
  return (
    <View testID="bottom-sheet-view" {...props}>
      {children}
    </View>
  );
}

export default BottomSheet;
export { BottomSheet, BottomSheetView };
