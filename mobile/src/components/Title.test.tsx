import { render } from "@testing-library/react-native";
import { Title } from "./Title";

describe("Title", () => {
  it("renders the provided text", async () => {
    const { getByText } = await render(<Title text="Channtto Scheduler" />);

    expect(getByText("Channtto Scheduler")).toBeTruthy();
  });
});
