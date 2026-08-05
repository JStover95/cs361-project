import React, { forwardRef, useImperativeHandle } from "react";
import { FlatList, FlatListProps, View, ViewProps } from "react-native";

type BottomSheetMethods = {
  snapToIndex: (index: number) => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
};

type BottomSheetProps = ViewProps & {
  children?: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  onChange?: (index: number) => void;
  onClose?: () => void;
  backgroundStyle?: object;
  handleIndicatorStyle?: object;
  containerStyle?: object;
  footerComponent?:
    | React.FC<BottomSheetFooterProps>
    | React.ReactElement
    | null;
};

type BottomSheetFooterProps = ViewProps & {
  animatedFooterPosition?: unknown;
  bottomInset?: number;
};

export const mockSnapToIndex = jest.fn();
export const mockClose = jest.fn();
export const mockExpand = jest.fn();
export const mockCollapse = jest.fn();

const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  ({ children, footerComponent, ...props }, ref) => {
    useImperativeHandle(ref, () => ({
      snapToIndex: mockSnapToIndex,
      close: mockClose,
      expand: mockExpand,
      collapse: mockCollapse,
    }));

    const footer =
      typeof footerComponent === "function"
        ? footerComponent({} as BottomSheetFooterProps)
        : footerComponent;

    return (
      <View testID="bottom-sheet" {...props}>
        {children}
        {footer}
      </View>
    );
  }
);
BottomSheet.displayName = "BottomSheet";

function BottomSheetView({ children, ...props }: ViewProps) {
  return (
    <View testID="bottom-sheet-view" {...props}>
      {children}
    </View>
  );
}

function BottomSheetFlatList<T>(props: FlatListProps<T>) {
  return <FlatList testID="bottom-sheet-flatlist" {...props} />;
}

function BottomSheetFooter({
  children,
  bottomInset: _bottomInset,
  animatedFooterPosition: _animatedFooterPosition,
  ...props
}: BottomSheetFooterProps) {
  return (
    <View testID="bottom-sheet-footer" {...props}>
      {children}
    </View>
  );
}

export default BottomSheet;
export {
  BottomSheet,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetFooter,
};
export type { BottomSheetFooterProps };
