import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { AUTHENTICATION_SERVICE_ENDPOINT } from "../utils/constants";
import {
  AuthProvider,
  NETWORK_ERROR_MESSAGE,
  useAuthContext,
} from "./AuthContext";

function AuthProbe() {
  const {
    userId,
    isAuthenticating,
    error,
    signUp,
    login,
    logout,
    clearError,
  } = useAuthContext();

  return (
    <View>
      <Text testID="user-id">{userId ?? "null"}</Text>
      <Text testID="is-authenticating">
        {isAuthenticating ? "true" : "false"}
      </Text>
      <Text testID="error">{error ?? "null"}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          signUp("user@example.com", "secret", "secret")
        }
      >
        <Text>Sign Up</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => login("user@example.com", "secret")}
      >
        <Text>Login</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={logout}>
        <Text>Logout</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={clearError}>
        <Text>Clear Error</Text>
      </Pressable>
    </View>
  );
}

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("AuthContext", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("starts with null userId, null error, and not authenticating", async () => {
    const { getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(getByTestId("user-id").props.children).toBe("null");
    expect(getByTestId("error").props.children).toBe("null");
    expect(getByTestId("is-authenticating").props.children).toBe("false");
  });

  it("stores userId on successful sign-up and posts to /register", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(201, {
        message: "User registered successfully.",
        user_id: "u-1",
      })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("u-1");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${AUTHENTICATION_SERVICE_ENDPOINT}/register`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "secret",
          password_confirmation: "secret",
        }),
      })
    );
  });

  it("stores userId on successful login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-2",
      })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("u-2");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${AUTHENTICATION_SERVICE_ENDPOINT}/login`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "secret",
        }),
      })
    );
  });

  it("surfaces the server's friendly message on invalid login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(401, { error: "Invalid email or password." })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("error").props.children).toBe(
        "Invalid email or password."
      );
    });
    expect(getByTestId("user-id").props.children).toBe("null");
  });

  it("surfaces the server's friendly message on invalid sign-up", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(400, {
        error: "An account with this email already exists.",
      })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByTestId("error").props.children).toBe(
        "An account with this email already exists."
      );
    });
  });

  it("toggles isAuthenticating during the request", async () => {
    let resolveFetch!: (value: Response) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("is-authenticating").props.children).toBe("true");
    });

    resolveFetch(
      (await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-2",
      })) as unknown as Response
    );

    await waitFor(() => {
      expect(getByTestId("is-authenticating").props.children).toBe("false");
      expect(getByTestId("user-id").props.children).toBe("u-2");
    });
  });

  it("surfaces a generic friendly message on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new TypeError("Network request failed")
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("error").props.children).toBe(NETWORK_ERROR_MESSAGE);
    });
  });

  it("clearError resets the error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(401, { error: "Invalid email or password." })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("error").props.children).toBe(
        "Invalid email or password."
      );
    });

    await fireEvent.press(getByText("Clear Error"));

    expect(getByTestId("error").props.children).toBe("null");
  });

  it("logout clears the userId", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-2",
      })
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByTestId("user-id").props.children).toBe("u-2");
    });

    await fireEvent.press(getByText("Logout"));

    expect(getByTestId("user-id").props.children).toBe("null");
  });

  it("throws when useAuthContext is used outside AuthProvider", async () => {
    function GuardProbe() {
      try {
        useAuthContext();
        return <Text testID="caught">ok</Text>;
      } catch (e) {
        return (
          <Text testID="caught">
            {e instanceof Error ? e.message : "unknown"}
          </Text>
        );
      }
    }

    const { getByTestId } = await render(<GuardProbe />);

    expect(getByTestId("caught").props.children).toBe(
      "useAuthContext must be used within an AuthProvider"
    );
  });
});
