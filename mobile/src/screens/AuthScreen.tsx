import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Title } from "../components/Title";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export const LOGIN_DELAY_MS = 500;

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  onLoginSuccess?: () => void;
};

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginPress = () => {
    if (mode === "signup") {
      setConfirmPassword("");
      setMode("login");
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      try {
        onLoginSuccess?.();
      } finally {
        setIsLoggingIn(false);
      }
    }, LOGIN_DELAY_MS);
  };

  const handleSignUpPress = () => {
    if (mode === "login") {
      setConfirmPassword("");
      setMode("signup");
    }
  };

  return (
    <View style={styles.container}>
      <Title text="Channtto Scheduler" />

      <View style={styles.form}>
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {mode === "signup" && (
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}
      </View>

      <View style={styles.buttons}>
        <Button
          label="Login"
          onPress={handleLoginPress}
          loading={isLoggingIn}
          disabled={isLoggingIn}
        />
        <Button
          label="Sign Up"
          onPress={handleSignUpPress}
          disabled={isLoggingIn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  form: {
    width: "100%",
    marginTop: 40,
    marginBottom: 32,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
});
