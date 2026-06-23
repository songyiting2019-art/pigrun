# Level Format

Levels are stored as fixed-size text grids in `src/levels.js`.

- `.` means empty cell.
- `u` means a pig facing up.
- `d` means a pig facing down.
- `l` means a pig facing left.
- `r` means a pig facing right.

The future level editor should edit this grid format, then use `parseLevelCells` and `serializeLevelCells` from `src/levels.js` to move between grid text and editable cell data.

Validation rule: do not place two pigs facing each other anywhere on the same row or column. For example, any `r` with an `l` somewhere to its right, or any `d` with a `u` somewhere below it, is invalid even when other pigs are between them. The editor and shuffle logic should reject these full-line faceoffs.
