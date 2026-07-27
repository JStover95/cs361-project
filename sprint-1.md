# Sprint 1

## User Stories

1. Account Management: As a registered user, I want to log in with an email and password so that only I can access my personal data.
2. Creating a Task: As a logged in user, I want to create a new task and enter its title, description, time required, importance, and urgency so that I can start blocking time in my day.
3. Updating a Task: As a logged in user, I want to update a task that I already created so that I can fix any mistakes, change the time required, or add new information so that I can quickly adapt to a changing schedule and shifting priorities.
4. Deleting a Task: As a logged in user, I want to delete any tasks from my schedule so that I can remove tasks that I no longer need to complete.

## Implemented components

1. Login/Signup Screen
   1. Email field
   2. Password field
   3. Login button
   4. Signup button
   5. Confirm password field on signup state
   6. On error, display an error message below the login/signup buttons
   7. When processing the login/signup, show a loader animation on the login button
   8. Pressing the login button attempts log in, then redirects the user to the today’s schedule screen
   9. On signup state, pressing the login button hides the confirm password button and immediately attempts a login
   10. Pressing the signup button in the login state shows the (empty) confirm password field
   11. Pressing the signup button from the signup state attempts user creation and logs in automatically on success
2. Today’s schedule screen
   1. Show welcome modals 1, 2, and 3
   2. Today label with left and right buttons (nonfunctional)
   3. View matrix button (nonfunctional)
   4. Block time button (nonfunctional)
   5. Tooltip under Block time button
   6. Bottom sheet
   7. Can drag the bottom sheet open or closed
   8. The tooltip appears after exiting the welcome modal
   9. Pressing the Block time button hides the tooltip
   10. Logout button in header
   11. Pressing the logout button logs out the user and redirects them to the login screen
3. Bottom sheet \- list state
   1. Plus button to add new tasks
   2. Pressing the add button opens the creating task state
   3. List of tasks (if any)
      1. Tasks are sorted alphabetically
   4. Tapping on a task changes the bottom sheet to its updating task state with the tapped task’s information prefilled
   5. Long-pressing on a task does nothing
   6. Swiping left on a task initializes the swipe to delete behavior
      1. Swiping left reveals a delete message below the task
      2. Swiping fully left triggers delete
   7. Swiping to delete transitions the bottom sheet to its delete message state
4. Bottom sheet \- creating/updating task states
   1. Title field
   2. Time required field (text, parsed with regex)
   3. Importance field (drop down)
   4. Urgency (drop down)
   5. Save button
   6. Cancel button
   7. Tapping the create button validates the form data, attempts to create the task, and resets the bottom sheet to its list state
      1. All fields are required
      2. The time required field must be a valid format (\\d+\\s\*h or \\d+\\s\*m or \\d+\\s\*h\\w\*\\s\*\\d+\\s\*m)
   8. Tapping the cancel button discards all changes and returns to the bottom sheet list state
   9. An error message is displayed in the error modal when an error occurs or the data is not validated
   10. In the updating state, the task’s Eisenhower color is displayed in the top right corner
   11. In the updating state, a delete button is displayed below the save/cancel buttons
   12. Pressing the delete button in the updating state transitions the bottom sheet to its delete message state
5. Bottom sheet \- delete message state
   1. Yes button
   2. Cancel button
   3. Pressing the Yes button attempts to delete the task and transitions to the list state on success
   4. On error, an error message is displayed with the error modal
   5. Pressing cancel returns to the previous state (updating or list)
6. Error modal
   1. Try again button
      1. The try again button is hidden when the error cannot be retried (e.g., validation)
   2. Go back button
   3. Pressing the try again button retries any action that caused the error
   4. Pressing Go back closes the modal without doing anything
7. Undo message
   1. Undo button
   2. Pressing the undo button undoes the last action
   3. Swiping on the message in any direction (left, right, up, down) swipes the message away
   4. The message automatically disappears on its own after 5 seconds
8. Modal
   1. Header
   2. Content
   3. Left button (optional)
   4. Right button (required)
   5. Left/right button actions are defined by the parent component
9. Input fields
   1. Email, text, password
   2. Custom validation function (e.g., email regex, time regex, not empty)
   3. Required label
   4. Optional placeholder
   5. Optional prefill
10. Buttons
    1. Small, medium, large, circle
    2. Grey, red
    3. Optional async action (e.g., loading spinner)
11. Tooltip
12. Task card
    1. Title, duration
    2. Eisenhower color
13. Eisenhower color
    1. Do (important, urgent): green
    2. Decide (important, not urgent): blue
    3. Delegate (not important, urgent): red
    4. Delete (not important, not urgent): white, grey outline

## Data elements

1. User
   1. Implemented with Supabase auth
2. Task
   1. Title
   2. Time required
   3. Importance
   4. Urgency
3. TaskDeleted

## Inclusivity Heuristics

1. Explain (to Users) the Benefits of Using New and Existing Features
   1. Introduction modal 1
2. Explain (to Users) the Costs of Using New and Existing Features
   1. Introduction modal 3
3. Let Users Gather as Much Information as They Want, and No More Than They Want
   1. Retractable bottom sheet
4. Keep Familiar Features Available
   1. Swipe to delete & trash icon
5. Make Undo/Redo and Backtracking Available
   1. Undo message
6. Provide an Explicit Path through the Task
   1. Introduction modal 2
   2. Tooltip for first step
7. Provide Ways to Try Out Different Approaches
   1. Slide to delete
   2. Delete from edit menu
8. Encourage Tinkerers to Tinker Mindfully
   1. Confirmation message when deleting

## Quality Attributes

1. Responsiveness
   1. Visual feedback on login
   2. Otherwise, instant feedback
2. Intuitiveness
   1. Tooltips
   2. Familiar buttons
3. Stability
   1. Error message on network failure
