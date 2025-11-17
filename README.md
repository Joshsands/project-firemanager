# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Bulk CSV import (projects)

You can import many projects at once via the app's Dashboard CSV uploader.

Quick instructions:

- Ensure your database has the new columns by running the SQL migration `sql/add_project_fields.sql` in your Supabase SQL editor.
- Prepare a CSV with a header row. Common headers the importer understands: `name,description,booked,closed,contract_amount,margin_start,margin_end,pm_name,customer,project_type` and any other columns added by the migration (e.g., `design_review_days`, `ahj_approval_days`, `design_review_completed`).
- Date fields can be ISO (YYYY-MM-DD) or commonly used formats (the importer will try to coerce).
- Upload the CSV from the Dashboard, click "Load preview", inspect the first rows, then click "Import to Supabase".

Notes:
- The importer performs basic coercion: numeric fields, integer day fields (`*_days`), boolean completed fields (`*_completed`) and date fields (`booked`, `closed`).
- For very large CSVs consider splitting into smaller files; the current importer inserts in a single batch.
- If you need column mapping or more robust parsing, tell me and I can add a header->DB mapping UI and batch import.
