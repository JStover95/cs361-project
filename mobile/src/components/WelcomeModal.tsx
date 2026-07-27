import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Modal } from "./Modal";

type WelcomeModalProps = {
  onFinish: () => void;
};

type Step = 1 | 2 | 3;

export function WelcomeModal({ onFinish }: WelcomeModalProps) {
  const [step, setStep] = useState<Step>(1);

  if (step === 1) {
    return (
      <Modal
        header="Welcome!"
        rightButton={{ label: "Next", onPress: () => setStep(2) }}
      >
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            With Channtto you can start prioritizing and scheduling to get more
            out of your day!
          </Text>
          <Text style={styles.paragraph}>Gain clarity by blocking time!</Text>
          <Text style={styles.paragraph}>
            Feel confident by prioritizing with our Eisenhower Matrix!
          </Text>
          <Text style={styles.paragraph}>
            Adapt to change by updating your schedule any time!
          </Text>
        </View>
      </Modal>
    );
  }

  if (step === 2) {
    return (
      <Modal
        header="Welcome!"
        leftButton={{ label: "Back", onPress: () => setStep(1) }}
        rightButton={{ label: "Next", onPress: () => setStep(3) }}
      >
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            We find that users get the most out of Channtto when they spend{" "}
            <Text style={styles.bold}>15 minutes</Text> at the start of their
            day to block time and create tasks.
          </Text>
          <Text style={styles.paragraph}>
            Building this into your morning routine will make sure you get the
            most out of your day!
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      header="Welcome!"
      leftButton={{ label: "Back", onPress: () => setStep(2) }}
      rightButton={{ label: "Done", onPress: onFinish }}
    >
      <View style={styles.content}>
        <Text style={styles.paragraph}>To get started:</Text>
        <Text style={styles.listItem}>
          1. Block some time on today's calendar
        </Text>
        <Text style={styles.listItem}>2. Start creating tasks</Text>
        <Text style={styles.listItem}>
          3. Add your tasks to your calendar
        </Text>
        <Text style={styles.listItem}>
          4. View your tasks in the Eisenhower Matrix
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  paragraph: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
  },
  listItem: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
});
