import { Modal } from "./Modal";

type LogoutConfirmationProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function LogoutConfirmation({
  onConfirm,
  onCancel,
}: LogoutConfirmationProps) {
  return (
    <Modal
      header="Log out?"
      leftButton={{ label: "Cancel", onPress: onCancel }}
      rightButton={{ label: "Log out", onPress: onConfirm }}
    >
      Are you sure you want to log out?
    </Modal>
  );
}
