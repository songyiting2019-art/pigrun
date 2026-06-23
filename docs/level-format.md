# Level Format

Levels are stored as fixed-size `9 x 12` text grids in `src/levels.js`.

- `.` means empty cell.
- `u` means a pig facing up.
- `d` means a pig facing down.
- `l` means a pig facing left.
- `r` means a pig facing right.

Each pig is a `2 x 1` body. The letter marks the head cell. The second body cell is behind the head, opposite the facing direction. For example, `r` at `(x, y)` also occupies `(x - 1, y)`, and `u` at `(x, y)` also occupies `(x, y + 1)`.

The future level editor should edit this grid format, then use `parseLevelCells` and `serializeLevelCells` from `src/levels.js` to move between grid text and editable cell data.

Validation rules:

- Pig bodies may not overlap or extend outside the board.
- Do not place two pigs facing each other anywhere on the same row or column. For example, any `r` with an `l` somewhere to its right, or any `d` with a `u` somewhere below it, is invalid even when other pigs are between them.

The editor and shuffle logic should reject overlapping bodies and full-line faceoffs.
