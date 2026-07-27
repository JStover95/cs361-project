import { fireEvent, render } from "@testing-library/react-native";
import { WelcomeModal } from "./WelcomeModal";

describe("WelcomeModal", () => {
  it("shows step 1 benefits copy with only Next", async () => {
    const { getByText, queryByText } = await render(
      <WelcomeModal onFinish={() => {}} />
    );

    expect(getByText("Welcome!")).toBeTruthy();
    expect(
      getByText(
        /With Channtto you can start prioritizing and scheduling to get more out of your day!/
      )
    ).toBeTruthy();
    expect(getByText(/Gain clarity by blocking time!/)).toBeTruthy();
    expect(getByText("Next")).toBeTruthy();
    expect(queryByText("Back")).toBeNull();
    expect(queryByText("Done")).toBeNull();
  });

  it("advances through steps and finishes on Done", async () => {
    const onFinish = jest.fn();
    const { getByText, queryByText } = await render(
      <WelcomeModal onFinish={onFinish} />
    );

    await fireEvent.press(getByText("Next"));
    expect(
      getByText(/We find that users get the most out of Channtto/)
    ).toBeTruthy();
    expect(getByText("15 minutes")).toBeTruthy();
    expect(getByText("Back")).toBeTruthy();
    expect(getByText("Next")).toBeTruthy();

    await fireEvent.press(getByText("Next"));
    expect(getByText(/To get started:/)).toBeTruthy();
    expect(getByText(/Block some time on today's calendar/)).toBeTruthy();
    expect(getByText("Back")).toBeTruthy();
    expect(getByText("Done")).toBeTruthy();
    expect(queryByText("Next")).toBeNull();

    await fireEvent.press(getByText("Done"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("goes back from step 3 to step 2 tip copy", async () => {
    const { getByText } = await render(<WelcomeModal onFinish={() => {}} />);

    await fireEvent.press(getByText("Next"));
    await fireEvent.press(getByText("Next"));
    expect(getByText(/To get started:/)).toBeTruthy();

    await fireEvent.press(getByText("Back"));
    expect(
      getByText(/We find that users get the most out of Channtto/)
    ).toBeTruthy();
  });
});
