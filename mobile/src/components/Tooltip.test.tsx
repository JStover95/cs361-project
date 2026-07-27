import { render } from "@testing-library/react-native";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("renders the given message", async () => {
    const { getByText } = await render(
      <Tooltip message="Start with blocking some time" />
    );

    expect(getByText("Start with blocking some time")).toBeTruthy();
  });
});
