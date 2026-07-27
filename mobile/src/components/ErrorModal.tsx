import { Modal } from "./Modal";

type ErrorModalProps = {
  message: string;
  onGoBack: () => void;
  onTryAgain?: () => void;
};

export function ErrorModal({
  message,
  onGoBack,
  onTryAgain,
}: ErrorModalProps) {
  return (
    <Modal
      header="An error occured!"
      leftButton={
        onTryAgain
          ? { label: "Try Again", onPress: onTryAgain }
          : undefined
      }
      rightButton={{ label: "Go back", onPress: onGoBack }}
    >
      {message}
    </Modal>
  );
}
