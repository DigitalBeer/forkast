# Page snapshot

```yaml
- region "Notifications alt+T"
- dialog "Share Meal Plan":
  - heading "Share Meal Plan" [level=2]
  - paragraph: "Week: Feb 1 - Feb 1, 2099"
  - paragraph: Include meal details
  - paragraph: Share ingredients and instructions
  - checkbox
  - text: Expiration (optional)
  - textbox "Expiration (optional)"
  - paragraph: Leave empty for no expiration.
  - text: Share link
  - button "Generate"
  - button "Copy" [disabled]
  - textbox "Generate a link to share"
  - paragraph: Existing share links
  - paragraph: No share links yet.
  - paragraph: Failed to create share link
  - button "Close"
  - button "Close"
```