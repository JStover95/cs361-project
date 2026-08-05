import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AuthProvider } from "../context/AuthContext";
import { AuthScreen } from "./AuthScreen";

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function renderAuth(onLoginSuccess?: () => void) {
  return render(
    <AuthProvider>
      <AuthScreen onLoginSuccess={onLoginSuccess} />
    </AuthProvider>
  );
}

async function fillCredentials(
  getByLabelText: (label: string | RegExp) => ReturnType<
    Awaited<ReturnType<typeof renderAuth>>["getByLabelText"]
  >,
  email: string,
  password: string,
  confirmPassword?: string
) {
  await fireEvent.changeText(getByLabelText("Email"), email);
  await fireEvent.changeText(getByLabelText("Password"), password);
  if (confirmPassword !== undefined) {
    await fireEvent.changeText(
      getByLabelText("Confirm Password"),
      confirmPassword
    );
  }
}

describe("AuthScreen", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders login mode by default without confirm password", async () => {
    const { getByText, queryByText } = await renderAuth();

    expect(getByText("Channtto Scheduler")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
    expect(getByText("Password")).toBeTruthy();
    expect(queryByText("Confirm Password")).toBeNull();
    expect(getByText("Login")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("disables auto capitalize on all auth fields", async () => {
    const { getByLabelText, getByText } = await renderAuth();

    expect(getByLabelText("Email").props.autoCapitalize).toBe("none");
    expect(getByLabelText("Password").props.autoCapitalize).toBe("none");

    await fireEvent.press(getByText("Sign Up"));

    expect(getByLabelText("Confirm Password").props.autoCapitalize).toBe(
      "none"
    );
  });

  it("shows confirm password when Sign Up is pressed in login mode", async () => {
    const { getByText } = await renderAuth();

    await fireEvent.press(getByText("Sign Up"));

    expect(getByText("Confirm Password")).toBeTruthy();
  });

  it("hides confirm password when Login is pressed in signup mode", async () => {
    const { getByText, queryByText } = await renderAuth();

    await fireEvent.press(getByText("Sign Up"));
    expect(getByText("Confirm Password")).toBeTruthy();

    await fireEvent.press(getByText("Login"));
    expect(queryByText("Confirm Password")).toBeNull();
  });

  it("calls onLoginSuccess after a successful login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-1",
      })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText } = await renderAuth(onLoginSuccess);

    await fillCredentials(getByLabelText, "user@example.com", "secret");
    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state on Login button during the request", async () => {
    let resolveFetch!: (value: Response) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText, queryByText, getAllByRole } =
      await renderAuth(onLoginSuccess);

    await fillCredentials(getByLabelText, "user@example.com", "secret");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(queryByText("Login")).toBeNull();
      expect(getByLabelText("Loading")).toBeTruthy();
    });

    const buttons = getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    resolveFetch(
      (await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-1",
      })) as unknown as Response
    );

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a friendly error on login failure and does not navigate", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(401, { error: "Invalid email or password." })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText, queryByText } =
      await renderAuth(onLoginSuccess);

    await fillCredentials(getByLabelText, "user@example.com", "wrong");
    await fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
      expect(getByText("Invalid email or password.")).toBeTruthy();
    });
    expect(onLoginSuccess).not.toHaveBeenCalled();

    await fireEvent.press(getByText("Go back"));

    expect(queryByText("An error occured!")).toBeNull();
  });

  it("calls onLoginSuccess after a successful sign-up", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(201, {
        message: "User registered successfully.",
        user_id: "u-2",
      })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText } = await renderAuth(onLoginSuccess);

    await fireEvent.press(getByText("Sign Up"));
    await fillCredentials(
      getByLabelText,
      "user@example.com",
      "secret",
      "secret"
    );
    await fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state on Sign Up button during the request", async () => {
    let resolveFetch!: (value: Response) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText, queryByText } =
      await renderAuth(onLoginSuccess);

    await fireEvent.press(getByText("Sign Up"));
    await fillCredentials(
      getByLabelText,
      "user@example.com",
      "secret",
      "secret"
    );
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(queryByText("Sign Up")).toBeNull();
      expect(getByLabelText("Loading")).toBeTruthy();
    });

    resolveFetch(
      (await jsonResponse(201, {
        message: "User registered successfully.",
        user_id: "u-2",
      })) as unknown as Response
    );

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a friendly error on sign-up failure and keeps signup mode", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(400, {
        error: "An account with this email already exists.",
      })
    );
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText, queryByText } =
      await renderAuth(onLoginSuccess);

    await fireEvent.press(getByText("Sign Up"));
    await fillCredentials(
      getByLabelText,
      "user@example.com",
      "secret",
      "secret"
    );
    await fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
      expect(
        getByText("An account with this email already exists.")
      ).toBeTruthy();
    });
    expect(onLoginSuccess).not.toHaveBeenCalled();

    await fireEvent.press(getByText("Go back"));

    expect(queryByText("An error occured!")).toBeNull();
    expect(getByText("Confirm Password")).toBeTruthy();
  });
});
