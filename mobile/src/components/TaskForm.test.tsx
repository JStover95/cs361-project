import { fireEvent, render } from "@testing-library/react-native";
import { TaskForm } from "./TaskForm";

const emptyValues = {
  title: "",
  timeRequired: "",
  importance: "" as const,
  urgency: "" as const,
};

describe("TaskForm", () => {
  it("renders create mode fields and buttons", async () => {
    const { getByText, queryByText } = await render(
      <TaskForm
        mode="create"
        initialValues={emptyValues}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(getByText("New Task")).toBeTruthy();
    expect(getByText("Title")).toBeTruthy();
    expect(getByText("Time required")).toBeTruthy();
    expect(getByText("Importance")).toBeTruthy();
    expect(getByText("Urgency")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(queryByText("Delete")).toBeNull();
  });

  it("renders update mode with color indicator and delete button", async () => {
    const { getByText, getByTestId, getByDisplayValue } = await render(
      <TaskForm
        mode="update"
        initialValues={{
          title: "Call mom",
          timeRequired: "30 min",
          importance: "High",
          urgency: "High",
        }}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );

    expect(getByText("Update Task")).toBeTruthy();
    expect(getByDisplayValue("Call mom")).toBeTruthy();
    expect(getByDisplayValue("30 min")).toBeTruthy();
    expect(getByTestId("eisenhower-dot")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });

  it("shows validation error and does not call onSave when fields are empty", async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <TaskForm
        mode="create"
        initialValues={emptyValues}
        onSave={onSave}
        onCancel={() => {}}
      />
    );

    await fireEvent.press(getByText("Save"));

    expect(getByText("All fields are required.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with values when valid", async () => {
    const onSave = jest.fn();
    const { getByText, getByLabelText } = await render(
      <TaskForm
        mode="create"
        initialValues={emptyValues}
        onSave={onSave}
        onCancel={() => {}}
      />
    );

    await fireEvent.changeText(getByLabelText("Title"), "Call mom");
    await fireEvent.changeText(getByLabelText("Time required"), "30m");
    await fireEvent.press(getByLabelText("Select Importance High"));
    await fireEvent.press(getByLabelText("Select Urgency High"));
    await fireEvent.press(getByText("Save"));

    expect(onSave).toHaveBeenCalledWith({
      title: "Call mom",
      timeRequired: "30m",
      importance: "High",
      urgency: "High",
    });
  });

  it("calls onCancel when Cancel is pressed", async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <TaskForm
        mode="create"
        initialValues={emptyValues}
        onSave={() => {}}
        onCancel={onCancel}
      />
    );

    await fireEvent.press(getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete is pressed in update mode", async () => {
    const onDelete = jest.fn();
    const { getByText } = await render(
      <TaskForm
        mode="update"
        initialValues={{
          title: "Call mom",
          timeRequired: "30m",
          importance: "High",
          urgency: "High",
        }}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );

    await fireEvent.press(getByText("Delete"));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
