# Level Format

Levels are stored as fixed-size text grids in `src/levels.js`.

- `.` means empty cell.
- `u` means a pig facing up.
- `d` means a pig facing down.
- `l` means a pig facing left.
- `r` means a pig facing right.

The future level editor should edit this grid format, then use `parseLevelCells` and `serializeLevelCells` from `src/levels.js` to move between grid text and editable cell data.

Validation rule: do not place two pigs facing each other on the same clear row or column. For example, `r...l` or a `d` above a `u` with only empty cells between them is invalid, because the pair cannot be solved by normal movement.
