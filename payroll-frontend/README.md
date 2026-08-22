<<<<<<< HEAD
# dayflow-human-resource-management-system
=======
# PayrollPro — Frontend

Frontend for an Employee Payroll & Workforce Management System. Pure HTML/CSS/vanilla JS — no build step, no dependencies, no server required.

## Run it

Open `index.html` in any browser.

Or serve it locally (recommended, so relative paths behave exactly like on a host):

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@payrollpro.com | admin123 |
| HR Manager | hr@payrollpro.com | hr123 |
| Employee | john@payrollpro.com | emp123 |

## Structure

```
.
├── index.html        # markup + screen containers
├── css/
│   └── styles.css    # design system, layout, components, responsive rules
└── js/
    └── app.js        # mock data store, routing, all feature logic
```

## What's implemented

- **Auth** — role-based login (admin / HR / employee), session switching
- **Employees** — add, edit, search, activate/deactivate
- **Departments** — CRUD with manager assignment
- **Salary structure** — Basic, HRA, DA, TA earnings; PF, ESI, tax deductions; auto net calculation
- **Payroll** — one-click monthly run, history tracking
- **Payslips** — print-ready payslip view with full breakdown
- **Leave** — apply, approve/reject workflow, balance tracker
- **Reports** — department-wise cost chart, top earners, component breakdown

## Data

All data lives in an in-memory `DB` object at the top of `js/app.js` and resets on refresh. It's the seam for a real backend: replace the direct `DB` reads/writes with `fetch` calls and the UI stays as-is.

## Notes for contributors

- No framework, no bundler — edit the files and reload.
- Fonts (Clash Display, Satoshi, JetBrains Mono) load from Google Fonts, so the first paint needs a network connection. Everything else works offline.
- Design tokens are CSS custom properties under `:root` in `css/styles.css` — change colors there, not in individual rules.

## License

MIT — see [LICENSE](LICENSE).
>>>>>>> 0877be6 (Initial commit: payroll management frontend)
