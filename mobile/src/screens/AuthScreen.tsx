import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../components/Button";
import { ErrorModal } from "../components/ErrorModal";
import { Input } from "../components/Input";
import { Title } from "../components/Title";
import { useAuthContext } from "../context/AuthContext";

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  onLoginSuccess?: () => void;
};

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { login, signUp, isAuthenticating, error, clearError } =
    useAuthContext();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLoginPress = async () => {
    if (mode === "signup") {
      setConfirmPassword("");
      setMode("login");
      return;
    }

    const success = await login(email, password);
    if (success) {
      onLoginSuccess?.();
    }
  };

  const handleSignUpPress = async () => {
    if (mode === "login") {
      setConfirmPassword("");
      setMode("signup");
      return;
    }

    const success = await signUp(email, password, confirmPassword);
    if (success) {
      onLoginSuccess?.();
    }
  };

  return (
    <View style={styles.container}>
      <Title text="Channtto Scheduler" />

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {mode === "signup" && (
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
      </View>

      <View style={styles.buttons}>
        <Button
          label="Login"
          onPress={handleLoginPress}
          loading={isAuthenticating && mode === "login"}
          disabled={isAuthenticating}
        />
        <Button
          label="Sign Up"
          onPress={handleSignUpPress}
          loading={isAuthenticating && mode === "signup"}
          disabled={isAuthenticating}
        />
      </View>

      {error && <ErrorModal message={error} onGoBack={clearError} />}
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
